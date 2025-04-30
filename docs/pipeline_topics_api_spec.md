# TOPICS配信機能 バックエンドAPI設計

---

## 1. POST /api/topics

- 概要: 新規TOPICS作成
- リクエスト例
```json
{
  "title": "2025年5月号 半導体TOPICS",
  "articles": [ { "id": 1, ... }, ... ],
  "categories": { "1": { "main": "技術", "sub": ["新製品"] }, ... }
}
```
- レスポンス例
```json
{ "id": "topics-uuid", "status": "ok" }
```
- バリデーション: タイトル必須、記事配列必須

---

## 2. PATCH /api/topics/{id}/article/{article_id}/category

- 概要: 記事ごとのカテゴリ編集
- リクエスト例
```json
{ "main": "技術", "sub": ["新製品"] }
```
- レスポンス例
```json
{ "status": "ok" }
```
- バリデーション: main必須

---

## 3. POST /api/topics/{id}/categorize

- 概要: LLM自動分類（選択記事IDを受けてカテゴリを返す）
- リクエスト例
```json
{ "article_ids": [1, 2, 3] }
```
- レスポンス例
```json
{
  "categories": {
    "1": { "main": "技術", "sub": ["新製品"] },
    "2": { "main": "経済", "sub": ["株価"] }
  }
}
```

---

## 4. POST /api/topics/{id}/export

- 概要: 配信テンプレートHTML出力（カテゴリ順でHTML生成）
- リクエスト例: なし（idでTOPICSを特定）
- レスポンス例
```json
{ "html": "<html>...</html>" }
```

---

## 5. データ構造

- TOPICS
  - id: string
  - title: string
  - articles: Article[]
  - categories: { [article_id: string]: { main: string, sub: string[] } }
  - template_html: string

- Article
  - id, title, url, source, published, summary, labels, thumbnailUrl, ...

---

## 6. バリデーション・エラーハンドリング

- タイトル未入力、記事未選択、カテゴリ未設定時は400エラー
- APIエラー時は{ "status": "error", "error": "..." }で返す

---