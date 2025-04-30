from typing import Tuple, List
from .llm_interface import LLMInterface

class DummyLLMService(LLMInterface):
    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, List[str]]:
        return "これはダミー要約です", ["ダミータグ1", "ダミータグ2"]

    def generate_categories(self, article_text: str) -> List[str]:
        return ["ダミー大カテゴリ", "ダミー小カテゴリ"]

    def generate_monthly_summary(self, articles: List[str]) -> str:
        return "これはダミー月次まとめです"