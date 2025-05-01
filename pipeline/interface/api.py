from fastapi import APIRouter, Query
from typing import Optional
from datetime import date
import uuid

router = APIRouter()
from fastapi.responses import JSONResponse
from fastapi.requests import Request as FastAPIRequest
from fastapi import status
from fastapi import FastAPI

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: FastAPIRequest, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": "error", "error": str(exc)},
    )

from usecase.crawl_articles import crawl_articles
from repository.db import (
    insert_job, update_job_status, get_job_by_id, get_job_history,
    get_db_conn, get_articles_by_topics_id, update_monthly_summary
)
from usecase.summarize_articles import summarize_articles
from usecase.tag_articles import tag_articles

from fastapi import Request
from fastapi import Body

# ジョブ管理（DB実装）
@router.post("/jobs/start")
def start_job(body: dict = Body(...)):
    """
    バッチ/AI処理のジョブを開始し、ジョブIDを返す
    """
    job_type = body.get("type", "summarize")
    # 実際のバッチ処理は非同期で実装する想定
    # ここでは即時完了とする
    job_id = insert_job(job_type, status="success")
    return {"job_id": job_id, "status": "success", "type": job_type}

@router.get("/jobs/{job_id}/status")
def get_job_status(job_id: int):
    """
    ジョブIDで進捗・状態を取得
    """
    job = get_job_by_id(job_id)
    if not job:
        return {"status": "not_found"}
    return {
        "job_id": job["id"],
        "status": job["status"],
        "type": job["type"],
        "started_at": job["started_at"],
        "finished_at": job["finished_at"],
        "result": job["result"]
    }

@router.get("/health")
def health_check():
    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                result = cur.fetchone()
        return {"status": "ok", "db": result[0]}
    except Exception as e:
        return {"status": "ng", "error": str(e)}

@router.post("/crawl")
def crawl(
    request: Request,
    start_date: date = Query(..., description="収集開始日（YYYY-MM-DD）"),
    end_date: Optional[date] = Query(None, description="収集終了日（YYYY-MM-DD、省略時はstart_dateと同じ）"),
    sources: Optional[list[str]] = Query(None, description="収集対象ソース（複数可）")
):
    print(f"[DEBUG] /crawl start_date={start_date} end_date={end_date} sources={sources}")
    if end_date is None:
        end_date = start_date
    result = crawl_articles(start_date, end_date, sources)
    return {"status": "ok", **result}

@router.post("/summarize")
def summarize(body: dict = Body(...)):
    try:
        limit = body.get("limit", 20)
        result = summarize_articles(limit=limit)
        return {"status": "ok", **result}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.post("/tag")
def tag(body: dict = Body(...)):
    try:
        limit = body.get("limit", 20)
        result = tag_articles(limit=limit)
        return {"status": "ok", **result}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# --- topics月次まとめ生成API ---
from service.ollama_llm_service import OllamaLLMService

@router.post("/topics/{topics_id}/summary")
def generate_monthly_summary(topics_id: int):
    """
    指定TOPICSの記事リストから月次まとめをLLMで生成し、DBに保存して返す
    """
    try:
        articles = get_articles_by_topics_id(topics_id)
        if not articles:
            return JSONResponse(content={"status": "error", "error": "記事が見つかりません"}, status_code=404)
        # 記事本文や要約を連結してLLMに渡す
        article_texts = []
        for art in articles:
            text = art.get("summary") or f"{art.get('title')}（{art.get('source')}）"
            article_texts.append(text)
        llm = OllamaLLMService()
        summary = llm.generate_monthly_summary(article_texts)
        update_monthly_summary(topics_id, summary)
        return JSONResponse(content={"monthly_summary": summary})
    except Exception as e:
        return JSONResponse(content={"status": "error", "error": str(e)}, status_code=500)

# --- topicsテンプレート出力API ---
from usecase.topics_export import export_topics_html

@router.post("/topics/{topics_id}/export")
def export_topics(topics_id: int):
    """
    指定TOPICSのテンプレHTMLを生成して返す
    """
    try:
        html = export_topics_html(topics_id)
        return JSONResponse(content={"html": html})
    except Exception as e:
        return JSONResponse(content={"status": "error", "error": str(e)}, status_code=500)

app.include_router(router)
