import os
from dotenv import load_dotenv
from typing import Tuple, List
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SequentialChain
from langchain_community.chat_models import ChatOpenAI
from .llm_interface import LLMInterface
from tenacity import retry, stop_after_attempt, wait_fixed

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

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, List[str]]:
        prompt_summary = PromptTemplate(
            input_variables=["article_text"],
            template="次の文章を200字以内で要約して。語尾は断定形で: {article_text}",
        )
        chain_summary = LLMChain(llm=self.llm, prompt=prompt_summary, output_key="article_summary")
        prompt_tags = PromptTemplate(
            input_variables=["article_summary"],
            template=(
                "次の記事の文章から、トピックを表すタグを生成して："
                "{article_text}\n"
                "登場する企業、業界、分類を表すような5～10個の単語または短いフレーズを、半角のカンマ「,」区切りで。"
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
            # フォールバック処理
            fallback_summary = article_text[:200] + "..."
            return fallback_summary, []

    @retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
    def generate_categories(self, article_text: str) -> List[str]:
        prompt = PromptTemplate(
            input_variables=["article_text"],
            template=(
                "次の文章を大カテゴリ・小カテゴリに分類し、カテゴリ名を日本語で、JSON配列で返してください。"
                "大カテゴリは、（経済・政治・技術・社会）"
                "小カテゴリは、（先端研究、生産技術、買収、企業の動き、国の動き、教育）"
                "\n文章: {article_text}"
            ),
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, output_key="categories")
        try:
            out = chain({'article_text': article_text})
            categories_json = out.get('categories', '').strip()
            import json
            categories = json.loads(categories_json)
            if not isinstance(categories, list):
                categories = []
            return categories
        except Exception as e:
            print(f"[ERROR] OpenAILLMService.generate_categories failed: {e}")
            # フォールバック処理
            return ["未分類"]

    def generate_monthly_summary(self, articles: List[str]) -> str:
        prompt = PromptTemplate(
            input_variables=["articles"],
            template=(
                "以下は今回の半導体TOPICSの主要な記事リストです。"
                "全体を総括して大勢の人に伝えたいので、この期間の半導体業界の動向・ポイントを500字程度でまとめてください。\n"
                "{articles}"
            ),
        )
        chain = LLMChain(llm=self.llm, prompt=prompt, output_key="monthly_summary")
        try:
            articles_text = "\n\n".join(articles)
            out = chain({'articles': articles_text})
            summary = out.get('monthly_summary', '').strip()
            return summary
        except Exception as e:
            print(f"[ERROR] OpenAILLMService.generate_monthly_summary failed: {e}")
            return ""
