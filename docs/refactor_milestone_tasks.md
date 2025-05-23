# 半導体TOPICS配信アプリ リファクタリング マイルストーン・タスク・確認内容

## 概要
- docs/refactor_architecture_plan.md の設計方針に基づき、段階的に安全にリファクタリング・機能追加を進める
- 各マイルストーンで動作確認を行い、安定性を担保
- AIエージェントが読んで実装できるよう、全タスクを明確化

---

## マイルストーン・タスク・確認内容

### マイルストーン1：API層の整理・admin権限APIの廃止
- [実装タスク]
  1. api/src/index.ts から `/api/admin/*` エンドポイントを削除し、必要なものは `/api/` に統合
  2. フロントエンドからadmin権限APIへの依存を除去
  3. API仕様書の更新（docs/api_spec.md等）
  4. 主要機能のE2Eテスト作成・実行
- [確認内容]
  - 記事一覧・詳細・収集・要約・タグ付け等の主要機能が正常動作する
  - admin権限APIが廃止され、一般APIに統一されている

---

### マイルストーン2：pipeline層のクリーンアーキテクチャ徹底・AI連携のinterface化
- [実装タスク]
  1. pipeline/service/llm_interface.py のinterfaceを拡張し、全AI処理を集約
  2. usecase層から直接AI/DBアクセスしている箇所をservice経由にリファクタ
  3. ジョブ管理・進捗取得用のAPI/DB設計・実装
  4. テスト用ダミーLLM実装
- [確認内容]
  - pipeline層の各ユースケース（記事クロール・要約・タグ付け・カテゴリ分け）がinterface経由でAI/DBにアクセス
  - LLM連携部分が差し替え可能
  - ジョブ管理・進捗取得APIが動作する

---

### マイルストーン3：フロントエンド再設計・TOPICS配信画面の新設
- [実装タスク]
  1. frontend/app/articles/page.tsx のUI/UXをMaterial UI等で統一
  2. カテゴリ分けボタンを削除し、TOPICS配信画面（frontend/app/topics/page.tsx）に機能を集約
  3. 記事選択・カテゴリ分け・配信テンプレ出力のUI/UX設計・実装
  4. API連携の見直し・テスト
- [確認内容]
  - 記事一覧・詳細ページが表/カード切替・検索・削除・詳細遷移に対応
  - カテゴリ分けUIがTOPICS配信画面に統合
  - TOPICS配信画面で記事選択・カテゴリ分け・配信テンプレ出力が可能

---

### マイルストーン4：配信テンプレート自動化・月次まとめ自動生成
- [実装タスク]
  1. テンプレートエンジン（Jinja2等）によるHTML出力機能の実装
  2. pipeline/service/llm_interface.py に「月次まとめ生成」メソッド追加
  3. フロントエンドから配信テンプレ出力・ダウンロード機能の実装
  4. テスト・動作確認
- [確認内容]
  - 配信テンプレート（HTML等）が自動生成され、記事・要約・カテゴリ・ポイントが自動挿入される
  - LLMによる月次まとめ・ポイント自動生成が可能

---

### マイルストーン5：AIエージェント実装を見据えたAPI/ジョブ管理・最終統合
- [実装タスク]
  1. usecase層の責務整理・ドキュメント化
  2. ジョブ管理APIの最終実装・テスト
  3. AIエージェント用API仕様書の作成
  4. 全体E2Eテスト・最終動作確認
- [確認内容]
  - すべてのビジネスロジックがusecase層に集約され、API/フロントエンドはI/Oに徹している
  - AIエージェントがジョブ管理APIを通じてバッチ処理を監視・制御できる
  - 全要件が実現されている

---

## 補足
- 各マイルストーンごとに「動作確認チェックリスト」を用意し、段階的に安定性を担保
- 実装タスクはAIエージェントでも自動化可能な粒度で記述
- 進捗・課題はdocs/以下にMarkdownで記録