import os
import psycopg
from psycopg.rows import dict_row
from typing import List
import json
from entity.article import Article

def get_db_conn():
    return psycopg.connect(
        host=os.environ.get("POSTGRES_HOST"),
        dbname=os.environ.get("POSTGRES_DB"),
        user=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"),
        autocommit=True,
        row_factory=dict_row
    )

def save_articles(articles: List[Article]) -> dict:
    # 記事リストをDBに保存する。既存データはスキップ。
    # :param articles: Articleのリスト
    # :return: {"inserted": 件数, "skipped": 件数}
    from datetime import datetime
    inserted, skipped = 0, 0
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            for art in articles:
                try:
                    # 型安全な変換
                    thumbnail_url = art.thumbnail_url or ""
                    published = art.published
                    if not isinstance(published, datetime):
                        published = datetime.fromisoformat(str(published))
                    cur.execute(
                        """
                        SELECT 1 FROM articles WHERE title=%s AND url=%s AND source=%s
                        """,
                        (art.title, art.url, art.source)
                    )
                    if cur.fetchone():
                        skipped += 1
                        continue
                    cur.execute(
                        """
                        INSERT INTO articles (title, url, source, summary, labels, thumbnail_url, created_at, published)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            art.title,
                            art.url,
                            art.source,
                            art.summary,
                            json.dumps(art.labels) if art.labels is not None else "[]",
                            thumbnail_url,
                            published,
                            published
                        )
                    )
                    inserted += 1
                except Exception as e:
                    print(f"[ERROR] save_articles: {e} (title={getattr(art, 'title', '')})")
    return {"inserted": inserted, "skipped": skipped}


# サムネイル未設定の記事を取得する
def get_articles_without_thumbnail(limit: int = 100) -> list:
    result = []
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, url FROM articles WHERE thumbnail_url IS NULL OR thumbnail_url = '' LIMIT %s",
                (limit,)
            )
            result = cur.fetchall()
    return result


# 記事のサムネイルURLを更新する
def update_article_thumbnail(article_id: int, thumbnail_url: str) -> None:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE articles SET thumbnail_url=%s WHERE id=%s",
                (thumbnail_url, article_id)
            )