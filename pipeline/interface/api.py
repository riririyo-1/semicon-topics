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
from repository.db import get_db_conn
from usecase.summarize_articles import summarize_articles
from usecase.tag_articles import tag_articles

from fastapi import Request
from fastapi import Body

# ジョブ管理（メモリ上の簡易実装）
job_store = {}

@router.post("/jobs/start")
def start_job(body: dict = Body(...)):
    """
    バッチ/AI処理のジョブを開始し、ジョブIDを返す
    """
    job_id = str(uuid.uuid4())
    job_type = body.get("type", "summarize")
    job_store[job_id] = {"status": "running", "type": job_type}
    # 実際のバッチ処理は非同期で実装する想定
    # ここでは即時完了とする
    job_store[job_id]["status"] = "success"
    return {"job_id": job_id, "status": job_store[job_id]["status"]}

@router.get("/jobs/{job_id}/status")
def get_job_status(job_id: str):
    """
    ジョブIDで進捗・状態を取得
    """
    job = job_store.get(job_id)
    if not job:
        return {"status": "not_found"}
    return {"job_id": job_id, "status": job["status"], "type": job["type"]}

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


app.include_router(router)
