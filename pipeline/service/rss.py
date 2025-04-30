import os
import re
from datetime import date, datetime as dt
from typing import List, Optional, Tuple

import feedparser
import httpx
from bs4 import BeautifulSoup
from dateutil import parser as date_parser
from dotenv import load_dotenv

import requests
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, SequentialChain
from langchain_community.chat_models import ChatOpenAI

from entity.article import Article

# --- スクレイピング用実装関数 ---

def fetch_article_text(url: str) -> str:

    # 指定URLから記事本文テキストを抽出する
    # <article>タグ優先、なければ全体テキスト
    
    try:
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")
        article_tag = soup.find("article")
        text = article_tag.get_text(separator=" ", strip=True) if article_tag else soup.get_text(separator=" ", strip=True)
        return re.sub(r"[\n\t\r]+", " ", text).strip()
    except Exception as e:
        print(f"[ERROR] fetch_article_text({url}): {e}")
        return ""


def fetch_thumbnail_url(url: str) -> str:
    
    # 指定URLからOGP画像を取得する
    
    try:
        resp = httpx.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")
        og = soup.find('meta', property='og:image')
        return og['content'] if og and og.get('content') else ''
    except Exception as e:
        print(f"[ERROR] fetch_thumbnail_url({url}): {e}")
        return ''


# build_llm_chain, generate_summary_and_labelsはapp/service/summarizer.pyに移動

# RSSフィード定義は外部yamlから読み込む
from repository.rss_feeds_loader import get_rss_feeds


def fetch_rss_articles(start_date: date, end_date: date, sources: Optional[List[str]] = None) -> List[Article]:
    # 指定期間・指定ソースのRSSを取得し、記事一覧を返却
    # RSSフィード定義は外部yamlから取得
    articles: List[Article] = []
    load_dotenv()
    feeds_dict = get_rss_feeds()
    keys = sources if sources else list(feeds_dict.keys())

    for key in keys:
        feeds = feeds_dict.get(key)
        if not feeds:
            continue
        # feedsはリスト形式
        for feed in feeds:
            source = feed["name"]
            url = feed["url"]
            try:
                resp = httpx.get(url, timeout=10)
                resp.raise_for_status()
                feed_data = feedparser.parse(resp.content)
                for entry in feed_data.entries:
                    # 日時取得
                    pub_dt: Optional[dt] = None
                    if getattr(entry, 'published_parsed', None):
                        tm = entry.published_parsed
                        pub_dt = dt(*tm[:6])
                    else:
                        dt_str = getattr(entry, 'published', None) or getattr(entry, 'updated', None)
                        if dt_str:
                            try:
                                pub_dt = date_parser.parse(dt_str)
                            except Exception:
                                print(f"[WARN] Could not parse date: {dt_str}")
                    if not pub_dt:
                        continue
                    if not (start_date <= pub_dt.date() <= end_date):
                        continue
                    # 本文・サムネ取得
                    content = fetch_article_text(entry.link)
                    thumbnail = fetch_thumbnail_url(entry.link)
                    # summary, labelsは空で初期化
                    summary = ""
                    labels = []
                    articles.append(Article(
                        title=entry.title,
                        url=entry.link,
                        source=source,
                        published=pub_dt,
                        summary=summary,
                        labels=labels,
                        thumbnail_url=thumbnail
                    ))
            except Exception as e:
                print(f"[ERROR] Failed RSS fetch for {source} ({url}): {e}")
    return articles

