import os
from dotenv import load_dotenv
from typing import Tuple, Dict
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SequentialChain
from langchain_community.chat_models import ChatOpenAI
from .llm_interface import LLMInterface

class OpenAILLMService(LLMInterface):
    def __init__(self):
        load_dotenv()
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            raise RuntimeError('OPENAI_API_KEY is not set')
        self.llm = ChatOpenAI(
            openai_api_key=self.api_key,
            model_name="gpt-4o",
            temperature=0.2,
            max_tokens=512,
        )

    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, list]:
        prompt_summary = PromptTemplate(
            input_variables=["article_text"],
            template="次の文章を200字以内で要約して。語尾は断定形で: {article_text}",
        )
        chain_summary = LLMChain(llm=self.llm, prompt=prompt_summary, output_key="article_summary")
        prompt_tags = PromptTemplate(
            input_variables=["article_summary"],
            template=(
                "次の記事の要約から、トピックを表すタグを生成して："
                "{article_summary}\n"
                "登場する企業、業界、分類を表すような2～10個の単語または短いフレーズを、カンマ区切りで。"
            ),
        )
        chain_tags = LLMChain(llm=self.llm, prompt=prompt_tags, output_key="article_tags")
        chain = SequentialChain(
            chains=[chain_summary, chain_tags],
            input_variables=["article_text"],
            output_variables=["article_summary", "article_tags"],
            verbose=False,
        )
        try:
            out = chain({'article_text': article_text})
            summary = out.get('article_summary', '').strip()
            tags = out.get('article_tags', '')
            labels = [t.strip() for t in tags.split(',') if t.strip()]
            return summary, labels
        except Exception as e:
            print(f"[ERROR] OpenAILLMService.generate_summary_and_labels failed: {e}")
            return "", []

    def generate_pest_tags(self, article_text: str) -> Dict[str, list]:
        prompt_pest = PromptTemplate(
            input_variables=["article_text"],
            template=(
                "次の文章をPEST分析（P:政治, E:経済, S:社会, T:技術）に基づき分類し、"
                "各カテゴリごとに小カテゴリタグ（2～5個/カテゴリ、なければ空配列）を日本語で抽出してください。"
                "出力は必ず以下のJSON形式で：\n"
                "{{\"P\": [\"...\"], \"E\": [\"...\"], \"S\": [\"...\"], \"T\": [\"...\"]}}\n"
                "文章: {article_text}"
            ),
        )
        chain_pest = LLMChain(llm=self.llm, prompt=prompt_pest, output_key="pest_tags")
        try:
            out = chain_pest({'article_text': article_text})
            pest_json = out.get('pest_tags', '').strip()
            import json
            pest_tags = json.loads(pest_json)
            for k in ["P", "E", "S", "T"]:
                if k not in pest_tags or not isinstance(pest_tags[k], list):
                    pest_tags[k] = []
            return pest_tags
        except Exception as e:
            print(f"[ERROR] OpenAILLMService.generate_pest_tags failed: {e}")
            return {"P": [], "E": [], "S": [], "T": []}