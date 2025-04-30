# summaryが設定済みでlabelsが未設定の記事に対してタグ付けを実行し、DBを更新するユースケース

import json
from repository.db import get_db_conn
from service.summarizer import generate_summary_and_labels
from datetime import datetime

def tag_articles(limit: int = 20) -> dict:
    # summaryが設定済みでlabelsが未設定の記事をDBから取得
    updated, errors = 0, 0
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, summary FROM articles WHERE (labels IS NULL OR labels = '[]' OR labels = '') AND summary IS NOT NULL AND summary != '' LIMIT %s",
                (limit,)
            )
            rows = cur.fetchall()
            # OpenAI APIキーはbuild_llm_chain内部で取得
            for row in rows:
                try:
                    summary = row["summary"]
                    # summaryからタグを生成（要約＋タグ付けAIを再利用、summaryのみ渡す）
                    _, labels = generate_summary_and_labels(summary)
                    cur.execute(
                        "UPDATE articles SET labels=%s WHERE id=%s",
                        (json.dumps(labels), row["id"])
                    )
                    updated += 1
                except Exception as e:
                    print(f"[ERROR] tag_articles failed: {e}")
                    errors += 1
    return {"updated": updated, "errors": errors}