# マイルストーン4・5 実装設計案

## 1. 全体像・データフロー

```mermaid
flowchart TD
    FE[Frontend (Next.js)] -- REST/Fetch --> API[API Gateway (Node.js/Express)]
    API -- HTTP --> PIPE[Pipeline (FastAPI/Python)]
    PIPE -- DBアクセス --> DB[(PostgreSQL)]
    PIPE -- LLM連携 --> LLM[(Ollama/OpenAI)]
    FE -- テンプレ出力/ダウンロード --> API
    API -- テンプレ出力/要約/カテゴリ/ジョブ管理 --> PIPE
```

---

## 2. テンプレート自動生成・月次まとめAPI設計

### (1) テンプレートエンジン導入
- pipeline/service/template_service.py（新規）でJinja2等を使い、HTMLテンプレート（templates/monthly_topics.html）を出力
- topics_data（記事・要約・カテゴリ・ポイント等）をテンプレに埋め込む

### (2) LLM月次まとめ生成
- llm_interface.pyの`generate_monthly_summary`をOllama/OpenAI/dummyで実装
- usecase層で記事リストを渡し、月次まとめテキストを取得

### (3) APIエンドポイント追加（pipeline/interface/api.py）
- `POST /topics/{id}/export`  
  - 指定TOPICSのテンプレHTMLを生成し返す
- `POST /topics/{id}/summary`  
  - 指定TOPICSの記事群から月次まとめを生成し返す

### (4) フロントエンド連携
- frontend/app/topics/page.tsxで「配信テンプレ出力」「ダウンロード」ボタンからAPI呼び出し
- 取得したHTMLをプレビュー・ダウンロード

---

## 3. ジョブ管理API設計

### (1) ジョブ管理API
- `POST /jobs/start`：バッチ/AI処理のジョブ開始（type, params指定）
- `GET /jobs/{job_id}/status`：進捗・状態取得
- `POST /jobs/{job_id}/stop`：ジョブ停止
- `GET /jobs/history`：ジョブ履歴取得

### (2) DBスキーマ例（jobsテーブル）
| id | type | status | started_at | finished_at | result |
|----|------|--------|------------|-------------|--------|
| UUID | 文字列 | pending/running/success/failure | datetime | datetime | JSON/text |

### (3) 状態遷移
- pending → running → success/failure
- stopでfailure/中断

### (4) 非同期処理
- Celery/バックグラウンドタスク等で実装（初期は同期でも可）

---

## 4. usecase層の責務明確化

- entity：データ構造定義（Article, Topics, Job等）
- usecase：ビジネスロジック（記事収集・要約・カテゴリ分け・テンプレ出力・ジョブ管理）
- service：LLM/テンプレ/DB/外部API連携
- repository：DB/外部データアクセス
- interface：APIエンドポイント

---

## 5. 実装タスク一覧

### テンプレート自動化・月次まとめ
- [ ] pipeline/service/template_service.py新規作成
- [ ] templates/monthly_topics.html作成
- [ ] llm_interface.py, ollama_llm_service.py, openai_llm_service.pyにgenerate_monthly_summary実装
- [ ] usecase/topics_export.py（新規）でテンプレ出力ロジック
- [ ] interface/api.pyにexport, summaryエンドポイント追加
- [ ] frontend/app/topics/page.tsxでAPI呼び出し・プレビュー・DL

### ジョブ管理API
- [ ] jobsテーブル設計・マイグレーション
- [ ] interface/api.pyにジョブ管理API追加・非同期化
- [ ] usecase/job_management.py（新規）でジョブ管理ロジック
- [ ] テスト追加

### ドキュメント・E2E
- [ ] usecase層の責務・入出力・依存関係をdocs/usecase_design.mdに記載
- [ ] AIエージェント用API仕様書（docs/agent_api_spec.md）作成
- [ ] E2Eテスト（pytest, cypress等）

---

## 6. 画面・API設計例

- GET /api/articles
- POST /api/topics
- PATCH /api/topics/:id/article/:article_id/category
- POST /api/topics/:id/export
- POST /api/topics/:id/summary
- POST /api/jobs/start
- GET /api/jobs/{job_id}/status

---

## 7. 補足・注意点

- 既存のダミー実装（dummy_llm_service.py等）は本実装と差し替え
- テンプレ出力・月次まとめAPIはフロントからの呼び出しを想定し、エラー時は詳細なレスポンスを返す
- ジョブ管理APIは将来的なAIエージェント連携を見据え、拡張性を持たせる