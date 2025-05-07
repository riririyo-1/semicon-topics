import json
from datetime import datetime
from repository.db import get_db_conn
from service.llm_interface import LLMInterface
from service.summarizer import get_llm_service
from service.rss import fetch_article_text
from entity.article import Article

def summarize_articles(limit: int = 20) -> dict:
    """
    summary/labels未設定の記事にAI要約・タグ付けを実行し、DBを更新する
    """
    updated, errors = 0, 0
    llm: LLMInterface = get_llm_service()
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, title, url, source, created_at, content FROM articles WHERE summary IS NULL OR summary = '' LIMIT %s",
                (limit,)
            )
            rows = cur.fetchall()
            for row in rows:
                try:
                    article = Article(
                        title=row["title"],
                        url=row["url"],
                        source=row["source"],
                        published=row["created_at"] if isinstance(row["created_at"], datetime) else datetime.fromisoformat(str(row["created_at"])),
                        content=row.get("content", "")
                    )
                    
                    # 記事本文を取得（DBに保存されている場合はそれを使用、なければURLから取得）
                    content = article.content
                    if not content:
                        print(f"[INFO] Fetching article text from URL: {article.url}")
                        content = fetch_article_text(article.url)
                        # DBのcontentフィールドを更新
                        if content:
                            cur.execute(
                                "UPDATE articles SET content=%s WHERE id=%s",
                                (content, row["id"])
                            )
                    
                    # 本文が取得できない場合はタイトルとURLを組み合わせて要約
                    if not content:
                        print(f"[WARN] Failed to get article content, using title and URL for summary: {article.url}")
                        input_for_llm = f"タイトル: {article.title}\nURL: {article.url}\n出典: {article.source}"
                    else:
                        input_for_llm = f"タイトル: {article.title}\n出典: {article.source}\nURL: {article.url}\n本文: {content}"
                        
                    summary, labels = llm.generate_summary_and_labels(input_for_llm)
                    cur.execute(
                        "UPDATE articles SET summary=%s, labels=%s WHERE id=%s",
                        (summary, json.dumps(labels, ensure_ascii=False), row["id"])
                    )
                    updated += 1
                except Exception as e:
                    print(f"[ERROR] summarize failed: {e}")
                    errors += 1
        return {"updated": updated, "errors": errors}