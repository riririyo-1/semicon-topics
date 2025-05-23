import os
import requests
import json
import time
from typing import Tuple, List
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

    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, List[str]]:
        prompt = (
            f"次の文章を200字以内で要約して。語尾は断定形で:\n{article_text}\n"
            "その要約から、登場する企業、業界、分類を表す2～10個の単語または短いフレーズを半角のカンマ「,」区切りで抽出し、"
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

    def generate_categories(self, article_text: str) -> List[str]:
        prompt = (
            f"次の文章を大カテゴリ・小カテゴリに分類してください。"
            f"カテゴリ名を日本語で、最大5つまでJSON配列で返してください。\n文章: {article_text}"
        )
        try:
            content = self._chat(prompt)
            categories = json.loads(content)
            if not isinstance(categories, list):
                categories = []
            return categories
        except Exception as e:
            print(f"[ERROR] OllamaLLMService.generate_categories failed: {e}")
            return []

    def generate_monthly_summary(self, articles: List[str]) -> str:
        prompt = (
            "以下は今月の主要な半導体業界の記事リストです。全体を総括して大勢の人に伝えたいので、半導体業界の動向・ポイントを200字以内でまとめてください。\n"
            + "\n\n".join(articles)
        )
        try:
            content = self._chat(prompt)
            return content.strip()
        except Exception as e:
            print(f"[ERROR] OllamaLLMService.generate_monthly_summary failed: {e}")
            return ""
