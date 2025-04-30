from datetime import date
from typing import List, Optional
from service import rss
from repository import db

def crawl_articles(
    start_date: date,
    end_date: date,
    sources: Optional[List[str]] = None
) -> dict:
    articles = rss.fetch_rss_articles(start_date, end_date, sources or [])
    result = db.save_articles(articles)
    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "fetched": len(articles),
        **result
    }