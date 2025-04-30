from typing import Protocol, Tuple, Dict

class LLMInterface(Protocol):
    def generate_summary_and_labels(self, article_text: str) -> Tuple[str, list]:
        ...

    def generate_pest_tags(self, article_text: str) -> Dict[str, list]:
        ...