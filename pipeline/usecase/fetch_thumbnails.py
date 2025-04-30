# サムネイル未設定の記事に対してサムネイル画像を取得し、DBを更新するユースケース

from repository.db import get_articles_without_thumbnail, update_article_thumbnail
from service.rss import fetch_thumbnail_url

def fetch_and_update_thumbnails(limit: int = 100) -> dict:
    # サムネイル未設定の記事をDBから取得
    articles = get_articles_without_thumbnail(limit)
    updated, errors = 0, 0
    for row in articles:
        try:
            url = row["url"]
            article_id = row["id"]
            thumbnail = fetch_thumbnail_url(url)
            if thumbnail:
                update_article_thumbnail(article_id, thumbnail)
                updated += 1
        except Exception as e:
            # エラー時はカウントのみ
            errors += 1
    return {"updated": updated, "errors": errors}