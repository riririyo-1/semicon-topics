# 半導体TOPICS配信アプリ リファクタリング・アーキテクチャ設計方針

## 1. リファクタリングの目的
- モダンでクリーンアーキテクチャな構成へ刷新し、保守性・拡張性・AIエージェント対応力を最大化
- 動作を止めず、段階的に安全に移行
- すべての要件（記事収集・要約・ラベル付け・TOPICS配信・テンプレ自動化等）を高品質に実現

---

## 2. 新アーキテクチャ全体像

```mermaid
flowchart TD
    subgraph Frontend[Next.js Frontend]
        FE1[記事一覧/詳細]
        FE2[TOPICS配信]
        FE3[記事収集UI]
    end
    subgraph API[API Gateway (Node.js/TypeScript)]
        API1[記事CRUD]
        API2[記事収集/要約/ラベル付け]
        API3[TOPICS管理]
    end
    subgraph Pipeline[AI/Batch Pipeline (Python)]
        PL1[記事クロール]
        PL2[要約・ラベル付け]
        PL3[カテゴリ分け]
        PL4[DBアクセス]
    end
    DB[(DB)]
    LLM[(LLM: OpenAI/Ollama)]
    
    FE1-->|REST/GraphQL|API1
    FE2-->|REST/GraphQL|API3
    FE3-->|REST/GraphQL|API2
    API1-->|内部API/Batch|PL4
    API2-->|内部API/Batch|PL1
    API2-->|内部API/Batch|PL2
    API3-->|内部API/Batch|PL3
    PL1-->|DB|DB
    PL2-->|DB|DB
    PL3-->|DB|DB
    PL2-->|LLM|LLM
    PL3-->|LLM|LLM
```

---

## 3. 設計思想・原則

- **クリーンアーキテクチャ徹底**  
  - entity, usecase, service, repository, interfaceの分離
  - ビジネスロジックはusecase層に集約
  - API層・UI層はI/Oに徹する

- **AIエージェント対応**  
  - LLM連携はinterface経由で差し替え可能
  - ジョブ管理・進捗取得APIを用意し、AIエージェントからの制御を容易に

- **段階的リファクタリング**  
  - 動作を止めず、マイルストーンごとに安定性を担保
  - 既存機能のE2Eテスト・動作確認を徹底

- **UI/UXのモダン化**  
  - Material UI等で統一
  - 表/カード切替、検索、詳細遷移、削除、タグ表示などを標準化

- **配信テンプレート自動化**  
  - テンプレートエンジンでHTML等を自動生成
  - LLMによる月次まとめ・ポイント自動生成

---

## 4. 主要コンポーネントと責務

- **Frontend (Next.js)**
  - 記事一覧・詳細・TOPICS配信・記事収集UI
  - API Gatewayと通信し、データ表示・操作

- **API Gateway (Node.js/TypeScript)**
  - REST/GraphQL APIの提供
  - 認証・認可（admin権限APIは廃止）
  - pipeline層との連携（バッチ/非同期処理のトリガー・進捗取得）

- **Pipeline (Python, FastAPI)**
  - 記事クロール・要約・ラベル付け・カテゴリ分け等のビジネスロジック
  - LLM連携（Ollama/OpenAI等）
  - DBアクセス
  - usecase層に全ロジックを集約

- **DB**
  - 記事・TOPICS・ジョブ管理等のデータ永続化

- **LLM**
  - 要約・ラベル付け・カテゴリ分け・月次まとめ生成

---

## 5. 今後の拡張性

- AIエージェントによる自律的な記事収集・要約・配信が容易
- 新たなLLMや外部APIへの対応もinterface差し替えで実現可能
- 配信テンプレートやUI/UXの追加・変更も疎結合で対応

---

## 6. 参考：画面遷移・API設計例（抜粋）

- 記事一覧 → 記事詳細 → TOPICS配信画面 → 配信テンプレ出力
- API例
  - GET /api/articles
  - POST /api/articles/crawl
  - POST /api/articles/summarize
  - POST /api/topics
  - GET /api/topics/:id
  - POST /api/topics/:id/export

---