from fastapi import FastAPI
from interface.api import router

# ollamaモデルpull自動化
try:
    from service.ollama_llm_service import ensure_ollama_model
    ensure_ollama_model()
except Exception as e:
    print(f"[WARN] ollama model auto-pull failed: {e}")

app = FastAPI(
    title="RSS pipeline API",
    description="指定期間のRSS記事を収集しDBへ保存するAPI",
    version="0.1.0"
)

app.include_router(router)