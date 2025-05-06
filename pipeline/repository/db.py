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
    from datetime import datetime
    inserted, skipped = 0, 0
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            for art in articles:
                try:
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

def update_article_thumbnail(article_id: int, thumbnail_url: str) -> None:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE articles SET thumbnail_url=%s WHERE id=%s",
                (thumbnail_url, article_id)
            )

def get_latest_articles(limit: int = 10) -> list:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, url, source, summary, labels, thumbnail_url, published
                FROM articles
                ORDER BY published DESC NULLS LAST, created_at DESC
                LIMIT %s
                """,
                (limit,)
            )
            return cur.fetchall()

def get_topic_by_id(topics_id: int) -> dict:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, month, created_at, monthly_summary
                FROM topics
                WHERE id = %s
                """,
                (topics_id,)
            )
            return cur.fetchone()

def get_articles_by_topics_id(topics_id: int) -> list:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT a.id, a.title, a.url, a.source, a.summary, a.labels, a.thumbnail_url, a.published,
                        ta.category_main, ta.category_sub
                FROM topics_articles ta
                JOIN articles a ON ta.article_id = a.id
                WHERE ta.topic_id = %s
                ORDER BY a.published DESC NULLS LAST, a.created_at DESC
                """,
                (topics_id,)
            )
            return cur.fetchall()

# ジョブ管理用DB関数
def insert_job(job_type: str, status: str = "pending") -> int:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO jobs (type, status, started_at) VALUES (%s, %s, NOW()) RETURNING id",
                (job_type, status)
            )
            job_id = cur.fetchone()["id"]
            return job_id

def update_job_status(job_id: int, status: str, result: str = None) -> None:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status=%s, finished_at=NOW(), result=%s WHERE id=%s",
                (status, result, job_id)
            )

def get_job_by_id(job_id: int) -> dict:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM jobs WHERE id=%s",
                (job_id,)
            )
            return cur.fetchone()

def get_job_history(limit: int = 20) -> list:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM jobs ORDER BY started_at DESC LIMIT %s",
                (limit,)
            )
            return cur.fetchall()

def update_monthly_summary(topics_id: int, summary: str) -> None:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE topics SET monthly_summary=%s WHERE id=%s",
                (summary, topics_id)
            )