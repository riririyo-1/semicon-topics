# マイルストーン2実装後のディレクトリ構成・API・主な変更点

---

## 1. ディレクトリ構成（主要部分のみ）

```
pipeline/
├── entity/
│   └── article.py
├── interface/
│   ├── __init__.py
│   └── api.py         # FastAPI/RESTエンドポイント
├── repository/
│   ├── __init__.py
│   ├── db.py          # DBアクセス
│   └── rss_feeds_loader.py
├── service/
│   ├── __init__.py
│   ├── llm_interface.py      # LLMインターフェース（抽象）
│   ├── ollama_llm_service.py # Ollama実装
│   ├── openai_llm_service.py # OpenAI実装
│   ├── summarizer.py         # 要約・ラベル付け
│   └── rss.py
├── usecase/
│   ├── __init__.py
│   ├── crawl_articles.py
│   ├── fetch_thumbnails.py
│   ├── summarize_articles.py
│   └── tag_articles.py
├── main.py             # FastAPIアプリ起動
└── tests/
    └── test_ai_pipeline.py
```

---

## 2. API（api/src/index.ts, pipeline/interface/api.py）の変化

- 既存API（/api/articles, /api/summarize, /api/crawl等）は大きく変わらない
- 新たに「ジョブ管理・進捗取得API」が追加される（例: POST /api/jobs/start, GET /api/jobs/{job_id}/status）
- すべてのバッチ/AI処理はusecase層→service層→interface層経由で呼び出される
- LLM連携はllm_interface.py経由でOllama/OpenAI/ダミーLLMを切り替え可能

---

## 3. 変更点の主張・全体像

- **クリーンアーキテクチャ徹底**  
  - entity, usecase, service, repository, interfaceの分離が明確化
  - 依存関係逆転（usecase→interface/service→repository）

- **LLM連携のinterface化**  
  - llm_interface.pyで抽象化し、Ollama/OpenAI/ダミーLLMを容易に切り替え
  - テスト容易性・拡張性が大幅向上

- **バッチ/非同期処理のジョブ管理API追加**  
  - ジョブ開始・進捗取得・履歴取得APIを追加
  - AIエージェントやフロントエンドからバッチ処理の状態監視・制御が可能

- **テスト用ダミーLLM実装**  
  - 本番/テストでLLM実装を切り替え可能

- **API仕様の自動ドキュメント化**  
  - OpenAPI/SwaggerでAPI仕様を自動生成・可視化

---

## 4. データフロー図（Mermaid）

```mermaid
flowchart TD
    FE[Frontend] -- REST/Fetch --> API[API Gateway (Node.js/Express)]
    API -- HTTP --> PIPE[Pipeline (FastAPI)]
    PIPE -- usecase --> USE[Usecase層]
    USE -- service --> SVC[Service層]
    SVC -- interface --> LLM[LLMInterface (Ollama/OpenAI/ダミー)]
    SVC -- repository --> DB[(PostgreSQL)]
    PIPE -- ジョブ管理API --> JOBS[ジョブ管理]
```

---

## 5. まとめ

- 要件一覧（記事収集・要約・ラベル付け・カテゴリ分け・AIエージェント対応）に完全準拠
- 内部実装の責務分離・拡張性・テスト容易性が大幅に向上
- API仕様・データフローも明確化され、今後の機能追加・保守も容易