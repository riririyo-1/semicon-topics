# 半導体TOPICS配信アプリ リファクタリング・アーキテクチャ設計・実装計画

---

## 1. 最終的にやりたいこと（要件一覧）

- 記事収集
  - 日付範囲指定でRSSから記事を収集
  - 日付・出典・タイトル・リンク・サムネイル画像を取得し、DBへ格納する
  - bs4などで記事本文をLLMに渡し、要約とラベル付けを行う
  - 記事一覧に表示する
- 記事一覧
  - 記事の一覧を表示する
  - 表・カード2種の表示
　- 選択と削除が可能
　- カードは画像、タイトル、出典、日付、タグが表示され、詳細ボタンと元記事へ飛ぶボタンがある
　- 検索が可能
　- 記事をクリックすると、1つの記事ページへ
　- 記事ページでは、画像、タイトル、出典、日付、タグに加えて要約も見れる。元記事へ飛ぶボタンがある
- 記事詳細
  - 画像・タイトル・出典・日付・タグ・要約・元記事リンク
- 半導体TOPICS配信（ここはまだ設計中。いいアイデアがあったら取り入れたい）
　- TOPICS一覧画面
　- TOPICSを新規作成（毎月作成を想定）
  - 全体の記事からその月の記事、ラベルに半導体がついた記事を表示
  - 毎月の半導体TOPICSに使う記事を選択できるようにする（記事登録ボタン）
  - 記事を決めたら、カテゴリ分けをする（記事本文をLLMに渡し、カテゴリ分けをする）
    - 大カテゴリ：政治・経済・社会・技術
    - 小カテゴリ：買収・製造技術・新製品・国の動き・企業の動き・株価
- 配信機能
　- ここまで出来たら、HTMLなどで出力。
　- テンプレを用意して、毎月同じ形式で出力可能。
　- 今月の記事一覧をLLMに投げて、月の動向・TOPICS・ポイントを入れられると尚良い。


配信テンプレはこんなイメージ。
```
～技術戦略コミッティ 半導体動向調査チーム　半導体TOPICS～
 
SSS MS事 MSテスト技術開発部 1課 の大森です。
今回は○年○月の半導体TOPICSをお送りします。
 
今月のまとめ：XXX 

■ 半導体動向調査チームより
★LSI戦略コミッティ 半導体動向調査チームのポータルサイトが新しくなりました。ぜひご覧ください！
★今後改善を加えていきたいと思います。ご意見、ご要望などありましたら、ご連絡ください。
★有料ニュースの詳細要望もお受けします。
 

■ TOPIX記事
＜世の中の動き＞　：大カテゴリ
エヌビディア時価総額3.43兆ドル、再び世界トップに－アップル上回る [bloomberg]
- 2024/11/6
-  https://www.bloomberg.co.jp/news/articles/2024-11-05/SMHXCKT0AFB400
米半導体大手のエヌビディアが、時価総額でアップルを上回り、再び世界トップに立った。エヌビディアの株価は今年183％上昇し、時価総額は2.2兆ドル以上増加した。
この上昇は、同社が製品の遅れや成長見通しに対する投資家の懸念を和らげたためだと言われている。エヌビディアは先月、一時的に時価総額トップになったが、すぐにアップルに抜かれていた。
しかし、人工知能（AI）に関連した成長への楽観論が株価を押し上げ、再びトップに立った。
 
imecが高NA EUV活用でムーアの法則の延命を宣言、ITF Japan 2024 [マイナビニュース]
- 2024/11/13
-  https://news.mynavi.jp/techplus/article/20241113-3063793/
ベルギーの独立系研究機関imecが創立40周年記念の研究成果発表会を開催し、CEO Luc Van den hove氏が基調講演を行った。
Van den hove氏は、半導体チップの集積度の向上を示す「ムーアの法則」は、高NA EUV露光装置や2D-FETなどの技術革新により、少なくとも2040年代まで継続できると強調した。
```

---
## 2. ディレクトリ構成とAPI役割図

### ディレクトリ構成（主要部分のみ）

```
semicon_topics2/
├── api/
│   └── src/
│       └── index.ts
├── backend/
│   └── src/
├── frontend/
│   └── app/
│       ├── articles/
│       ├── crawl/
│       ├── summarize/
│       └── topics/
├── pipeline/
│   ├── service/
│   ├── usecase/
│   └── main.py
├── docs/
│   └── refactor_full_plan.md
├── package.json
└── ...
```

### API役割・データフロー図

```mermaid
flowchart TD
    FE[Frontend (Next.js)] -- REST/Fetch --> API[API Gateway (Node.js/Express)]
    API -- HTTP --> PIPE[Pipeline (FastAPI/Python)]
    PIPE -- DBアクセス --> DB[(PostgreSQL)]
    PIPE -- LLM連携 --> LLM[(Ollama/OpenAI)]
```

---

## 2. リファクタリングの目的
- モダンでクリーンアーキテクチャな構成へ刷新し、保守性・拡張性・AIエージェント対応力を最大化
- 動作を止めず、段階的に安全に移行
- すべての要件（記事収集・要約・ラベル付け・TOPICS配信・テンプレ自動化等）を高品質に実現

---

## 3. 新アーキテクチャ全体像

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

## 4. 設計思想・原則

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

## 5. マイルストーン・タスク・確認内容

### マイルストーン1：API層の整理・admin権限APIの廃止
- [詳細タスク手順]
  1. **api/src/index.tsのadminエンドポイント削除・統合**
     - `/api/admin/crawl`, `/api/admin/summarize`, `/api/admin/pest_tag` などのエンドポイントを削除
     - pest_tag関連のAPI・ロジック・importもすべて一時的に削除
     - 必要な機能は `/api/crawl` など一般APIに統合し、ルーティング・認可ロジックを整理
     - 例: `app.post("/api/admin/crawl", ...)` を `app.post("/api/crawl", ...)` に統合
     - 不要なimportやadmin権限チェックも削除
  2. **フロントエンドのAPI呼び出し修正**
     - `frontend/app/` 配下で `/api/admin/*` を呼び出している箇所を `/api/*` に修正
     - 例: `fetch("/api/admin/crawl")` → `fetch("/api/crawl")`
     - admin権限UIや認可ロジックがあれば削除
  3. **API仕様書の更新**
     - `docs/api_spec.md` などに現状のAPIエンドポイント・パラメータ・レスポンス例を記載
     - 削除・統合したエンドポイントは「廃止」等の注記を明記
  4. **主要機能のE2Eテスト作成・実行**
     - `backend/tests/` などにAPIのE2Eテストを追加・修正
     - 例: 記事取得・登録・削除・クロール・要約・タグ付けのAPIテスト
     - テスト実行コマンド例: `npm test` または `yarn test`
     - テストが全てパスすることを確認
  5. **webディレクトリ削除（frontend一本化後）**
     - frontendで全機能が正常動作することを確認した上で、webディレクトリを削除
     - 削除コマンド例: `rm -rf web`
     - `.gitignore`やCI/CD設定等でwebディレクトリへの依存がないかも確認
- [確認内容]
  - 記事一覧・詳細・収集・要約・タグ付け等の主要機能が正常動作する
  - admin権限APIが廃止され、一般APIに統一されている
  - pest_tag機能が一時的に除去されている（API・UI・DBカラム等）
  - webディレクトリ削除後も全機能が正常動作すること（E2Eテスト・手動確認含む）

  ※ pest_tag（害虫タグ）機能は、マイルストーン3以降で「半導体TOPICS用の新しいカテゴリ・タグ機能」として再設計・実装予定

### 【補足】OpenAPI/Swaggerの導入方針

- API（Node.js/Express/TypeScript）側でOpenAPI/Swagger UIを導入することで、API仕様の自動ドキュメント化・型安全性向上・フロントエンド/AIエージェントとの連携が容易になります。
- 導入手順（例）:
  1. `api/package.json`に`swagger-ui-express`と`swagger-jsdoc`を追加
     - `npm install swagger-ui-express swagger-jsdoc`
  2. `api/src/index.ts`でswagger-jsdocでスキーマを自動生成し、swagger-ui-expressで`/api-docs`エンドポイントを追加
     - 例:
       ```ts
       import swaggerUi from "swagger-ui-express";
       import swaggerJSDoc from "swagger-jsdoc";
       const swaggerSpec = swaggerJSDoc({
         definition: {
           openapi: "3.0.0",
           info: { title: "Semicon API", version: "1.0.0" },
         },
         apis: ["./src/index.ts"], // JSDocコメントから自動生成
       });
       app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
       ```
  3. 各APIエンドポイントにJSDoc形式でOpenAPIコメントを追加
     - 例:
       ```ts
       /**
        * @openapi
        * /api/articles:
        *   get:
        *     summary: 記事一覧取得
        *     responses:
        *       200:
        *         description: 記事リスト
        */
       ```
  4. ブラウザで`/api-docs`にアクセスするとSwagger UIでAPI仕様が確認できる

- これにより、API仕様の自動ドキュメント化・型安全性向上・フロントエンド/AIエージェントとの連携が容易になります。
---

### マイルストーン2：pipeline層のクリーンアーキテクチャ徹底・AI連携のinterface化
- [詳細タスク手順]
  1. **pipeline/service/llm_interface.pyのinterface拡張**
     - 既存の`LLMInterface`に「要約・ラベル付け・タグ付け・カテゴリ分け・月次まとめ生成」など全AI処理のメソッドを定義
     - 例: `def generate_summary_and_labels(self, article_text: str) -> Tuple[str, list]:`
     - 必要に応じて型ヒント・ドキュメントコメントも追加
  2. **OllamaLLMService, OpenAILLMServiceの実装拡張**
     - interfaceで定義した全メソッドを実装
     - 例: `def generate_pest_tags(self, article_text: str) -> Dict[str, list]:`
     - LLM呼び出し部分はtry/exceptでエラーハンドリング
  3. **usecase層のリファクタ**
     - `pipeline/usecase/`配下でAI/DBアクセスしている箇所をservice経由に統一
     - 例: `from ..service.llm_interface import get_llm_service` で取得し、interface経由で呼び出す
     - 直接DBアクセスもrepository/service経由に整理
  4. **ジョブ管理・進捗取得API/DB設計・実装**
     - pipeline/main.pyまたはinterface/api.pyに「ジョブ開始」「進捗取得」APIを追加
     - 例: `POST /api/jobs/start`, `GET /api/jobs/{job_id}/status`
     - ジョブ情報はDB（例: jobsテーブル）で管理
     - DBスキーマ例: `id, type, status, started_at, finished_at, result`
  5. **ユースケース・APIのテスト作成・実行**
     - `pipeline/tests/`配下にユースケース・APIのテストを追加
     - テスト実行コマンド例: `pytest pipeline/tests/`
     - ジョブ管理API・AI連携の正常系/異常系を網羅
- [確認内容]
  - pipeline層の各ユースケース（記事クロール・要約・タグ付け・カテゴリ分け）がinterface経由でAI/DBにアクセスしている
  - ジョブ管理・進捗取得APIが動作し、DBにジョブ履歴が記録される
  - すべてのテストがパスすること

---

### マイルストーン3：フロントエンド再設計・TOPICS配信画面の新設
- [詳細タスク手順]
  1. **記事一覧・詳細UIの再設計・実装**
     - `frontend/app/articles/page.tsx` のUI/UXをMaterial UI等で統一
     - 表/カード切替、検索、選択、削除、詳細遷移、タグ・画像・要約表示を実装
     - `frontend/app/articles/[id]/page.tsx` で詳細ページのUI/UXも統一
     - マウスをホバーした時に、カードの周りがうっすら青く光る。
  3. **TOPICS配信画面の新設・機能実装**
     - `frontend/app/topics/page.tsx` を新規作成またはリファクタ
     - 記事選択、カテゴリ分け（大カテゴリ・小カテゴリ）、配信テンプレ出力のUI/UXを実装
     - 記事選択はチェックボックスやドラッグ&ドロップ等で実装
     - カテゴリ分けはLLM連携APIを呼び出して自動分類も可能に
     - 配信テンプレ出力は「プレビュー」「ダウンロード」ボタン等で実装
  4. **API連携の見直し・修正**
     - 記事取得・カテゴリ分け・テンプレ出力等のAPI呼び出しを整理
     - 必要に応じてAPI Gateway側のエンドポイントも修正
     - fetch/axios等の呼び出し先・パラメータ・エラーハンドリングを統一
  5. **E2Eテスト・UIテストの作成・実行**
     - `frontend/tests/`等にCypress/Playwright等でE2Eテストを作成
     - 主要な画面遷移・操作・API連携のテストを網羅
     - テスト実行コマンド例: `npx cypress run` または `npx playwright test`
- [確認内容]
  - 記事一覧・詳細ページが表/カード切替・検索・削除・詳細遷移に対応し、UI/UXが統一されている
  - カテゴリ分けUIがTOPICS配信画面に統合されている
  - TOPICS配信画面で記事選択・カテゴリ分け・配信テンプレ出力が可能
  - すべてのE2E/UIテストがパスすること

---

### マイルストーン4：配信テンプレート自動化・月次まとめ自動生成
- [詳細タスク手順]
  1. **テンプレートエンジン導入・HTML出力機能実装**
     - `pipeline/service/`配下にJinja2等のテンプレートエンジンを導入
     - 配信テンプレート（HTML等）の雛形ファイルを作成（例: `templates/monthly_topics.html`）
     - 記事・要約・カテゴリ・ポイントをテンプレートに埋め込むロジックを実装
     - テンプレート出力用のサービス関数を作成（例: `generate_monthly_topics_html(topics_data)`）
  2. **LLM連携メソッド追加**
     - `pipeline/service/llm_interface.py`に「月次まとめ生成」メソッドを追加
     - 例: `def generate_monthly_summary(self, articles: List[Article]) -> str:`
     - OllamaLLMService, OpenAILLMServiceにも実装
     - テスト用ダミーLLMにも同メソッドを追加
  3. **フロントエンド連携・UI実装**
     - `frontend/app/topics/page.tsx`等で「配信テンプレ出力」「ダウンロード」ボタンを実装
     - API経由でテンプレートHTMLを取得し、プレビュー・ダウンロードできるようにする
     - 必要に応じて「月次まとめ」もLLM経由で取得し、テンプレートに反映
  4. **APIエンドポイント追加・修正**
     - API Gatewayまたはpipeline側に「テンプレート出力」「月次まとめ生成」用のエンドポイントを追加
     - 例: `POST /api/topics/:id/export`, `POST /api/topics/:id/summary`
     - fetch/axios等で呼び出し、エラーハンドリングも実装
  5. **テスト・動作確認**
     - テンプレート出力・月次まとめ生成のユニットテスト・APIテストを作成
     - フロントエンドからのE2Eテストも追加
     - テスト実行コマンド例: `pytest pipeline/tests/`, `npx cypress run`
- [確認内容]
  - 配信テンプレート（HTML等）が自動生成され、記事・要約・カテゴリ・ポイントが自動挿入される
  - LLMによる月次まとめ・ポイント自動生成が可能
  - フロントエンドからテンプレート出力・ダウンロード・プレビューができる
  - すべてのテストがパスすること

---

### マイルストーン5：AIエージェント実装を見据えたAPI/ジョブ管理・最終統合
- [詳細タスク手順]
  1. **usecase層の責務整理・ドキュメント化**
     - `pipeline/usecase/`配下の各ユースケース関数・クラスの責務を明確化
     - 役割・入出力・依存関係をdocstringやdocs/usecase_design.md等に記載
     - 依存注入・interface経由の呼び出しに統一されているか確認
  2. **ジョブ管理APIの最終実装・テスト**
     - pipeline/main.pyまたはinterface/api.pyでジョブ管理API（開始・進捗・停止・履歴取得等）を最終実装
     - DBスキーマ・マイグレーションも最終化
     - ジョブの状態遷移（例: pending→running→success/failure）を明確化
     - API/DBの単体・統合テストを作成・実行
  3. **AIエージェント用API仕様書の作成**
     - AIエージェントが利用するAPIエンドポイント・パラメータ・レスポンス例・認証方式等をdocs/agent_api_spec.md等に記載
     - ジョブ管理API・記事収集/要約/配信APIの利用例も記載
     - curlやhttpie等での呼び出し例も明記
  4. **全体E2Eテスト・最終動作確認**
     - フロントエンド・API・pipeline・DB・LLM連携を含むE2Eテストを作成・実行
     - 主要なユースケース（記事収集→要約→カテゴリ分け→配信テンプレ出力→ジョブ管理）を網羅
     - テスト実行コマンド例: `pytest`, `npx cypress run` など
     - テスト・手動確認で全要件が満たされていることを確認
- [確認内容]
  - すべてのビジネスロジックがusecase層に集約され、API/フロントエンドはI/Oに徹している
  - AIエージェントがジョブ管理APIを通じてバッチ処理を監視・制御できる
  - API仕様書・設計ドキュメントが最新化されている
  - 全要件が実現され、すべてのテストがパスすること

---

## 6. 主要コンポーネントと責務

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

## 7. 今後の拡張性

- AIエージェントによる自律的な記事収集・要約・配信が容易
- 新たなLLMや外部APIへの対応もinterface差し替えで実現可能
- 配信テンプレートやUI/UXの追加・変更も疎結合で対応

### 【補足】webディレクトリの扱いについて

現状、webディレクトリはNext.jsの雛形ですが、実装ファイルがなく、実際のUI/UXはfrontendディレクトリで管理されています。
今後の拡張やリプレイス用途が明確でなければ、frontendに一本化し、webディレクトリは削除・統合する方がシンプルで保守性も高くなります。
（将来的に用途が明確になった場合のみ再作成を検討）

---

## 8. 参考：画面遷移・API設計例（抜粋）

- 記事一覧 → 記事詳細 → TOPICS配信画面 → 配信テンプレ出力
- API例
  - GET /api/articles
  - POST /api/articles/crawl
  - POST /api/articles/summarize
  - POST /api/topics
  - GET /api/topics/:id
  - POST /api/topics/:id/export

---
