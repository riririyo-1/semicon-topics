# RSSフィード定義をyamlから読み込むローダ
# get_rss_feeds()でdict形式のフィード一覧を取得できる

import os
import yaml

def get_rss_feeds(config_path=None):
    ## 指定されたYAMLファイルからRSSフィードを読み込む関数
    # デフォルトパスはpipeline/rss_feeds.yaml
    if config_path is None:
        config_path = "rss_feeds.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        feeds = yaml.safe_load(f)
    return feeds