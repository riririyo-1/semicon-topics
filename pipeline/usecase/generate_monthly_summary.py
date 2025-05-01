from typing import List
from repository.db import get_topic_by_id, get_articles_by_topics_id, update_monthly_summary
from service.summarizer import get_llm_service

def generate_monthly_summary(topics_id: int) -> str:
    """
    指定topics_idの全記事を取得し、LLMで月次まとめを生成し、DBに保存して返す
    """
    topic = get_topic_by_id(topics_id)
    if not topic:
        raise ValueError(f"topics_id={topics_id} のTOPICSが見つかりません")
    articles_db = get_articles_by_topics_id(topics_id)
    # 記事本文または要約をまとめてリスト化
    article_texts: List[str] = []
    for art in articles_db:
        # summaryがあればsummary、なければtitle+url
        if art.get("summary"):
            article_texts.append(art["summary"])
        else:
            # summaryがなければタイトルとURLをつなげておく
            article_texts.append(f"{art.get('title', '')} {art.get('url', '')}")
    if not article_texts:
        raise ValueError("記事が1件もありません")
    llm = get_llm_service()
    monthly_summary = llm.generate_monthly_summary(article_texts)
    update_monthly_summary(topics_id, monthly_summary)
    return monthly_summary