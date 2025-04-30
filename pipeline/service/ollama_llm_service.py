import os
import requests
import json
import time
from typing import Tuple, Dict
from .llm_interface import LLMInterface

def ensure_ollama_model(max_retries: int = 3, wait_sec: int = 10):
    """
    ollamaに指定モデルが存在しなければpullする。pull失敗時はリトライ。
    """
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://ollama:11434")
    model = os.environ.get("OLLAMA_MODEL", "llama2:7b-q4")
    for attempt in range(max_retries):
        try:
            resp = requests.get(f"{base_url}/api/tags", timeout=10)
            resp.raise_for_status()
            tags = resp.json().get("models", [])
            if any(model in (m.get("name") or "") for m in tags):
                print(f"[INFO] ollama model '{model}' already exists")
                return
        except Exception as e:
            print(f"[WARN] ollama model check failed: {e}")
        # pull
        try:
            print(f"[INFO] pulling ollama model '{model}' ... (attempt {attempt+1})")
            resp = requests.post(f"{base_url}/api/pull", json={"name": model}, timeout=600)
            resp.raise_for_status()
            print(f"[INFO] ollama model '{model}' pull complete")
            return
        except Exception as e:
            print(f"[ERROR] ollama model pull failed: {e}")
            if attempt < max_retries - 1:
                print(f"[INFO] retrying in {wait_sec} seconds...")
                time.sleep(wait_sec)
    raise RuntimeError(f"ollama model '{model}' could not be pulled after {max_retries} attempts")

class OllamaLLMService(LLMInterface):
    def __init__(self):
        self.base_url = os.environ.get("OLLAMA_BASE_URL", "http://ollama:11434")
        self.model = os.environ.get("OLLAMA_MODEL", "llama2:7b-q4")

    def _chat(self, prompt: str) -> str:
        # Ollama OpenAI互換API: /v1/chat/completions
        url = f"{self.base_url}/v1/chat/completions"
        headers = {"Content-Type": "application/json"}
        data = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        resp = requests.post(url, headers=headers, data=json.dumps(data), timeout=60)
        resp.raise_for_status()
        result = resp.json()
        # OpenAI互換: result["choices"][0]["message"]["content"]
        return result["choices"][0]["message"]["content"]

    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, list]:
        prompt = (
            f"次の文章を200字以内で要約して。語尾は断定形で:\n{article_text}\n"
            "その要約から、登場する企業、業界、分類を表す2～10個の単語または短いフレーズをカンマ区切りで抽出し、"
            "要約とタグをそれぞれJSONで返してください。例: {\"summary\": \"...\", \"labels\": [\"...\", ...]}"
        )
        try:
            content = self._chat(prompt)
            data = json.loads(content)
            summary = data.get("summary", "")
            labels = data.get("labels", [])
            if not isinstance(labels, list):
                labels = []
            return summary, labels
        except Exception as e:
            print(f"[ERROR] OllamaLLMService.generate_summary_and_labels failed: {e}")
            return "", []

    def generate_pest_tags(self, article_text: str) -> Dict[str, list]:
        prompt = (
            "次の文章をPEST分析（P:政治, E:経済, S:社会, T:技術）に基づき分類し、"
            "各カテゴリごとに小カテゴリタグ（2～5個/カテゴリ、なければ空配列）を日本語で抽出してください。"
            "出力は必ず以下のJSON形式で：\n"
            "{\"P\": [\"...\"], \"E\": [\"...\"], \"S\": [\"...\"], \"T\": [\"...\"]}\n"
            f"文章: {article_text}"
        )
        try:
            content = self._chat(prompt)
            pest_tags = json.loads(content)
            for k in ["P", "E", "S", "T"]:
                if k not in pest_tags or not isinstance(pest_tags[k], list):
                    pest_tags[k] = []
            return pest_tags
        except Exception as e:
            print(f"[ERROR] OllamaLLMService.generate_pest_tags failed: {e}")
            return {"P": [], "E": [], "S": [], "T": []}