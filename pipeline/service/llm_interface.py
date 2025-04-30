from typing import Protocol, Tuple, List

class LLMInterface(Protocol):
    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, List[str]]:
        """記事本文から要約とラベルリストを生成"""
        ...

    def generate_categories(self, article_text: str) -> List[str]:
        """記事本文からカテゴリ（大カテゴリ・小カテゴリ等）を推論"""
        ...

    def generate_monthly_summary(self, articles: List[str]) -> str:
        """複数記事から月次まとめ（要約・ポイント）を生成"""
        ...
