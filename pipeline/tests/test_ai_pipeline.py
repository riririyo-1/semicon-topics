import pytest
from unittest.mock import patch
from service import rss
from service.openai_llm_service import OpenAILLMService

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

def test_generate_summary_and_labels_with_fallback():
    service = OpenAILLMService()
    
    # 正常なケース
    with patch.object(service, 'llm', autospec=True) as mock_llm:
        mock_llm.return_value = {
            'article_summary': 'これは要約です',
            'article_tags': 'AI, 半導体'
        }
        summary, labels = service.generate_summary_and_labels("テスト本文")
        assert summary == "これは要約です"
        assert labels == ["AI", "半導体"]

    # エラー発生時のフォールバック
    with patch.object(service, 'llm', side_effect=Exception("LLM Error")):
        summary, labels = service.generate_summary_and_labels("テスト本文")
        assert summary == "テスト本文"[:200] + "..."
        assert labels == []