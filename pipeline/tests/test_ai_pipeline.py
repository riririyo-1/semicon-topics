import pytest
from unittest.mock import patch
from service import rss

def test_scrape_article_content_and_thumbnail_mock():
    with patch("service.rss.scrape_article_content_and_thumbnail") as mock_scrape:
        mock_scrape.return_value = ("本文テスト", "https://example.com/image.jpg")
        content, thumbnail = rss.scrape_article_content_and_thumbnail("https://example.com")
        assert content == "本文テスト"
        assert thumbnail == "https://example.com/image.jpg"

def test_generate_summary_and_labels_mock():
    with patch("service.rss.generate_summary_and_labels") as mock_gen:
        mock_gen.return_value = ("要約テスト", ["AI", "半導体"])
        summary, labels = rss.generate_summary_and_labels("テスト本文")
        assert summary == "要約テスト"
        assert labels == ["AI", "半導体"]