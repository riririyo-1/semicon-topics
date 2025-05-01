from datetime import datetime
from typing import Any, Dict
from service.template_service import generate_monthly_topics_html
from repository.db import get_topic_by_id, get_articles_by_topics_id

def export_topics_html(topics_id: int) -> str:
    """
    指定topics_idのTOPICSデータ・記事リストを取得し、テンプレHTMLを生成して返す
    """
    topic = get_topic_by_id(topics_id)
    if not topic:
        raise ValueError(f"topics_id={topics_id} のTOPICSが見つかりません")
    articles_db = get_articles_by_topics_id(topics_id)
    articles = []
    for art in articles_db:
        articles.append({
            "title": art.get("title"),
            "url": art.get("url"),
            "source": art.get("source"),
            "published": art.get("published").strftime("%Y-%m-%d") if art.get("published") else "",
            "summary": art.get("summary") or "",
            "labels": art.get("labels") if isinstance(art.get("labels"), list) else [],
            "category_main": art.get("category_main") or "",
            "category_sub": art.get("category_sub") if isinstance(art.get("category_sub"), list) else [],
        })
    topics_data = {
        "topics_title": topic.get("title"),
        "topics_month": topic.get("month"),
        "created_at": topic.get("created_at").strftime("%Y-%m-%d") if topic.get("created_at") else "",
        "monthly_summary": topic.get("monthly_summary") or "",
        "articles": articles
    }
    html = generate_monthly_topics_html(topics_data)
    return html