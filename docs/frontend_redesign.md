# フロントエンド再設計仕様書（App Routerベース）

---

## 1. ディレクトリ・ルーティング設計

```
/app
  /articles         ... 記事一覧・詳細・TOPIX
    /[id]/page.tsx
    /page.tsx
  /crawl            ... 記事収集UI
    /page.tsx
  /summarize        ... AIバッチ・要約・タグ付け
    /page.tsx
  /topics           ... PEST分析・トピック一覧
    /page.tsx
  /layout.tsx       ... 共通レイアウト・ナビゲーション
  /page.tsx         ... トップページ（お知らせ・ダッシュボード等）
```

---

## 2. 各画面のUI/UXワイヤー・主要コンポーネント

### `/articles` 記事一覧・詳細

- タブ切替：「全記事」「半導体TOPIX」など
- 検索・フィルタ：キーワード、日付、ラベル、PESTカテゴリ
- 記事カード：タイトル、URL、日付（published）、出展元、要約、ラベル（Chip）、PEST大カテゴリ（色分けChip）、小カテゴリ（サブChip）
- ページネーション・表示件数切替
- 詳細ページ（/[id]/page.tsx）へのリンク

### `/crawl` 記事収集

- 期間（日付ピッカー）、ソース選択（チェックボックス）
- 「記事収集」ボタン、進捗・結果表示
- 収集済み記事のテーブル表示

### `/summarize` AIバッチ

- 「要約生成」「タグ生成」「PESTタグ生成」ボタン
- 実行結果・進捗表示
- バッチ後のデータ反映

### `/topics` PEST分析・トピック一覧

- PEST大カテゴリごとの記事・トピック集計
- 小カテゴリ・用語のランキング
- フィルタ・絞り込み

### `/page.tsx` トップページ

- お知らせ・ダッシュボード・主要機能へのリンク

---

## 3. ナビゲーション・共通レイアウト

- サイドバーまたはトップナビで「記事一覧」「記事収集」「AIバッチ」「PEST分析」等を切替
- 各画面で共通のレイアウト・テーマ（MUI/TypeScript）

---

## 4. データフロー・API連携

- /api/articles ... 記事一覧・詳細取得
- /api/crawl ... 記事収集
- /api/admin/summarize, /api/admin/tag, /api/admin/pest_tag ... AIバッチ
- /api/topics ... PEST分析・トピック集計

---

## 5. 画面遷移・操作フロー例

1. `/articles`で記事を検索・絞り込み、詳細を閲覧
2. `/crawl`で新規記事を収集
3. `/summarize`でAIバッチを実行し、要約・ラベル・PESTタグを付与
4. `/topics`でPEST分析・トピックを可視化

---

## 6. その他

- 既存のadmin/crawl/articles等の混在は廃止し、上記構成に統一
- 必要に応じて`/tools`や`/workspace`等で機能をまとめてもOK
- API/DB/フロントの型整合性を重視

---