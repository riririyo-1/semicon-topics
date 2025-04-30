from dataclasses import dataclass
from datetime import datetime
from typing import List
from dataclasses import field

@dataclass
class Article:
    """
    記事データを表すエンティティ

    :param title: 記事タイトル
    :param url: 記事URL
    :param source: 情報源
    :param published: 公開日時（datetime型）
    :param summary: 要約
    :param labels: ラベルリスト
    :param thumbnail_url: サムネイル画像URL
    """
    title: str
    url: str
    source: str
    published: datetime
    summary: str = ""
    labels: List[str] = field(default_factory=list)
    thumbnail_url: str = ""