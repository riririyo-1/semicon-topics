# マイルストーン3：RSS自動収集 設計・受け入れ基準・テスト要件

---

## 1. サービス構成・全体像

**依存パッケージの管理方針**
- 依存パッケージの追加は各package.jsonやrequirements.txtを編集し、`docker-compose build` で反映させる
- ホスト環境で直接 `npm install` や `pip install` を実行する必要はありません
- frontend/Dockerfile などで `npm install` が自動実行されます

- **crawler（Python 3.11 + FastAPI）**  
  - 非同期でRSS取得・パース  
  - 期間指定（日付単位、開始日／終了日）  
  - DB（Postgres）へtitle, url, sourceを重複チェックしつつINSERT  
  - HTTP/JSON API（OpenAPI/Swagger UI自動生成）

- **docker-compose.yml**  
  - crawlerサービス新規追加

- **Express API（api/src/index.ts）**  
  - `/api/admin/crawl` POSTエンドポイント追加  
  - 期間パラメータ受け取り、crawler APIを呼び出し

- **Next.js管理画面（frontend/app/admin/page.tsx）**  
  - 日付ピッカー（開始日／終了日）  
  - 「記事収集」ボタン  
  - 実行中／完了ステータス表示（ローディングスピナー or 成功／失敗メッセージ）  
  - UIコンポーネントはMUI, Ant Design, shadcn/ui等を利用

---

## 2. RSS取得対象

- https://eetimes.jp/rss/
- https://www.itmedia.co.jp/rss/news.xml
- https://www3.nhk.or.jp/rss/news/cat0.xml
- https://news.mynavi.jp/rss/index.rdf

---

## 3. 受け入れ基準

- crawlerコンテナが上記RSSを取得し、articlesテーブルに重複なく保存できる
- 期間指定（日付単位）が可能で、指定範囲の記事のみ保存される
- /api/admin/crawlエンドポイントが動作し、crawler APIを呼び出して結果を返す
- 管理画面から記事収集がトリガーでき、実行中／完了ステータスが表示される
- デフォルトで1日分の収集が可能
- テスト（単体・統合テスト雛形）が用意されている

---

## 4. テスト要件

- モックRSSフィードでcrawler単体テストが通る
- 既存記事と重複しないことを確認するテスト
- /api/admin/crawlの統合テスト雛形が存在する
- 管理画面からのトリガーでDBに記事が追加されることを確認できる
- 期間指定の境界値（開始日・終了日）で正しくフィルタされる

---

## 5. 実装イメージ（Mermaid）

```mermaid
flowchart TD
  subgraph Frontend (Next.js)
    AdminPage["管理画面（/admin）"]
    DatePicker["開始日／終了日ピッカー"]
    Button["記事収集ボタン"]
    Status["実行中／完了ステータス"]
  end
  subgraph API (Express)
    CrawlAPI["/api/admin/crawl"]
  end
  subgraph Crawler (FastAPI)
    RSSFetcher["RSSクローラー"]
  end
  subgraph DB (Postgres)
    ArticlesTable["articlesテーブル"]
  end

  AdminPage --> DatePicker
  AdminPage --> Button
  AdminPage --> Status
  Button -- fetch(POST) --> CrawlAPI
  DatePicker -- fetch(POST) --> CrawlAPI
  CrawlAPI -- HTTP/JSON --> RSSFetcher
  RSSFetcher -- INSERT (重複チェック) --> ArticlesTable
```

---