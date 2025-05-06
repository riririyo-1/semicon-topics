from typing import List
from repository.db import get_topic_by_id, get_articles_by_topics_id, update_monthly_summary
from service import summarizer # summarizerモジュールをインポート
from service.rss import fetch_article_text

def generate_monthly_summary(topics_id: int, llm_provider: str = None) -> str: # llm_provider 引数を追加
    """
    指定topics_idの全記事を取得し、LLMで月次まとめを生成し、DBに保存して返す
    """
    topic = get_topic_by_id(topics_id)
    if not topic:
        raise ValueError(f"topics_id={topics_id} のTOPICSが見つかりません")
    articles_db = get_articles_by_topics_id(topics_id)
    # 記事本文をまとめてリスト化
    article_texts: List[str] = []
    for art in articles_db:
        article_url = art.get("url")
        if article_url:
            body = fetch_article_text(article_url)
            if body: # 本文が取得できた場合のみ追加
                article_texts.append(body)
            elif art.get("summary"): # 本文取得失敗時はsummaryを利用
                article_texts.append(art["summary"])
            else: # summaryもなければタイトルとURL
                article_texts.append(f"{art.get('title', '')} {article_url}")
        elif art.get("summary"): # URLがない場合はsummaryを利用
            article_texts.append(art["summary"])
        else: # URLもsummaryもなければタイトルのみ
             article_texts.append(f"{art.get('title', '')}")

    if not article_texts:
        raise ValueError("記事が1件もありません")
    
    llm = summarizer.get_llm_service(provider=llm_provider) # llm_provider を渡す
    monthly_summary_text = llm.generate_monthly_summary(article_texts)
    update_monthly_summary(topics_id, monthly_summary_text)
    return monthly_summary_text