import json
from repository.db import get_db_conn
from service.summarizer import generate_pest_tags
from datetime import datetime

def categorize_pest_articles(limit: int = 20) -> dict:
    updated, errors = 0, 0
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            # pest_tagsが未設定、labels/summaryがある全記事を対象に取得
            cur.execute(
                """
                SELECT id, summary, labels FROM articles
                WHERE (pest_tags IS NULL OR pest_tags = '{}' OR pest_tags::text = '')
                  AND labels IS NOT NULL AND labels != ''
                  AND summary IS NOT NULL AND summary != ''
                LIMIT %s
                """,
                (limit,)
            )
            rows = cur.fetchall()
            print(f"[DEBUG] fetched {len(rows)} rows")
            for row in rows:
                print(f"[DEBUG] row id={row.get('id', '?')}, pest_tags={row.get('pest_tags', '?')}")
                try:
                    summary = row["summary"]
                    pest_tags = generate_pest_tags(summary)
                    cur.execute(
                        "UPDATE articles SET pest_tags=%s WHERE id=%s",
                        (json.dumps(pest_tags, ensure_ascii=False), row["id"])
                    )
                    updated += 1
                except Exception as e:
                    print(f"[ERROR] categorize_pest_articles failed: {e}")
                    errors += 1
    return {"updated": updated, "errors": errors}