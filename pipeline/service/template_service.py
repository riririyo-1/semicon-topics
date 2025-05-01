from jinja2 import Environment, FileSystemLoader
import os
from datetime import datetime

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "../templates")
TEMPLATE_FILE = "monthly_topics.html"

def generate_monthly_topics_html(topics_data: dict) -> str:
    """
    topics_data例:
    {
        "topics_title": "2025年5月 半導体TOPICS",
        "topics_month": "2025-05",
        "created_at": "2025-05-01",
        "monthly_summary": "今月のまとめテキスト",
        "articles": [
            {
                "title": "記事タイトル",
                "url": "https://...",
                "source": "出典",
                "published": "2025-05-01",
                "summary": "要約テキスト",
                "labels": ["ラベル1", "ラベル2"],
                "category_main": "技術",
                "category_sub": ["新製品", "製造技術"]
            },
            ...
        ]
    }
    """
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR, encoding="utf-8"),
        autoescape=True
    )
    template = env.get_template(TEMPLATE_FILE)
    html = template.render(**topics_data)
    return html