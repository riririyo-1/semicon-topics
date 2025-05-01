import os
from dotenv import load_dotenv
from typing import Tuple, Dict
from .llm_interface import LLMInterface

# LLM実装のimport
from .openai_llm_service import OpenAILLMService
from .ollama_llm_service import OllamaLLMService

load_dotenv()
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai").lower()

def get_llm_service() -> LLMInterface:
    if LLM_PROVIDER == "ollama":
        return OllamaLLMService()
    elif LLM_PROVIDER == "openai":
        return OpenAILLMService()
    else:
        raise ValueError(f"Invalid LLM provider: {LLM_PROVIDER}")

_llm = get_llm_service()

def generate_summary_and_labels(article_text: str) -> Tuple[str, list]:
    return _llm.generate_summary_and_labels(article_text)
