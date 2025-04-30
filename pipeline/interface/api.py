from fastapi import APIRouter, Query
from typing import Optional
from datetime import date

router = APIRouter()
from fastapi.responses import JSONResponse
from fastapi.requests import Request as FastAPIRequest
from fastapi import status
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)

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
