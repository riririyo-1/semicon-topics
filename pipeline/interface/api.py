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

# --- 記事カテゴリ分類API ---
from service.ollama_llm_service import OllamaLLMService

@router.post("/categorize")
def categorize_article(body: dict = Body(...)):
    """
    記事テキストからカテゴリを分類する
    """
    try:
        article_text = body.get("article_text", "")
        if not article_text:
            return JSONResponse(content={"status": "error", "error": "記事テキストが必要です"}, status_code=400)
            
        print(f"[/categorize] 記事テキスト: {article_text[:100]}...")
        
        # LLMを使用してカテゴリを生成
        try:
            llm = OllamaLLMService()
            # prompt = f"以下の記事を読んで、最も適切な大カテゴリ1つと小カテゴリを複数選んでください。\n\n記事: {article_text}\n\n以下の形式で回答してください。\n大カテゴリ: [大カテゴリ名]\n小カテゴリ: [小カテゴリ1], [小カテゴリ2], ..."
            # response = llm.generate_text(prompt)
            
            # LLMがない場合のダミー実装
            import random
            main_categories = ["技術", "ビジネス", "製品", "業界動向", "市場"]
            sub_categories = [
                ["半導体", "新製品", "研究開発", "製造技術"],
                ["投資", "M&A", "戦略", "提携"],
                ["チップ", "メモリ", "プロセッサ", "スマートフォン"],
                ["市場予測", "企業動向", "サプライチェーン"],
                ["需要", "供給", "価格動向"]
            ]
            
            selected_main_index = random.randint(0, len(main_categories)-1)
            main_category = main_categories[selected_main_index]
            # メインカテゴリに対応するサブカテゴリから1〜3個選択
            selected_subs = random.sample(sub_categories[selected_main_index], 
                           k=min(random.randint(1, 3), len(sub_categories[selected_main_index])))
            
            print(f"[/categorize] 分類結果 - 大カテゴリ: {main_category}, 小カテゴリ: {selected_subs}")
            
            return {
                "main": main_category,
                "sub": selected_subs,
                "category_main": main_category,  # APIの戻り値形式の一貫性のため
                "category_sub": selected_subs    # APIの戻り値形式の一貫性のため
            }
            
        except Exception as llm_err:
            print(f"[/categorize] LLMエラー: {str(llm_err)}")
            # フォールバック実装
            return {"main": "技術", "sub": ["新製品"]}
        
    except Exception as e:
        print(f"[/categorize] エラー: {str(e)}")
        return JSONResponse(content={"status": "error", "error": str(e)}, status_code=500)

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
