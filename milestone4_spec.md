# マイルストーン4：要約 & ラベル付け 実装計画（ブラッシュアップ版）

---

## 1. 概要

- RSS収集後、LangChain + OpenAI API で各記事を **200字以内で要約**
- 同じく OpenAI で「業界」「ジャンル」「企業名」「製品名」等の **具体的な汎用ラベル** を抽出
- 記事本文は全文スクレイピングし、サムネイル画像（OGP等）も取得
- `articles` テーブルに `summary, labels, thumbnail_url` カラムを追加し保存（labelsはJSONB配列）
- Express の `/api/articles` レスポンスに `summary, labels, thumbnailUrl` を含める
- Next.js の記事一覧の新しいページで要約・ラベル・サムネイルも表示（タグ風ラベル、summaryは折りたたみUI）
- 必要に応じてバッチ処理のログ出力・エラーハンドリング・リトライ・キャッシュを実装
- AI部分の単体テスト雛形（LangChain/スクレイピングのモック）を用意
- any禁止、型安全・CI/CD・Lint徹底

---

## 2. DB設計・エンティティ

### articles テーブル

```sql
ALTER TABLE articles 
  ADD COLUMN summary TEXT,                     -- 200字以内の要約
  ADD COLUMN labels JSONB,                     -- タグ風表示しやすい JSON 配列
  ADD COLUMN thumbnail_url TEXT;               -- サムネイル画像 URL
```

- labels例: `["AI","半導体","NVIDIA","技術解説"]`
- thumbnail_url: OGP等から取得した画像URL

### エンティティ定義

#### Python

```python
@dataclass
class Article:
    title: str
    url: str
    source: str
    published: date
    summary: str
    labels: List[str]
    thumbnail_url: str
```

#### TypeScript

```ts
interface Article {
  id: number;
  title: string;
  url: string;
  source: string;
  created_at: string;
  summary: string;
  labels: string[];
  thumbnailUrl: string;
}
```

---

## 3. クローラ（Python）

- RSS取得 → fetch_rss_articles()
- 各記事のlinkに対してHTTPリクエスト
  - newspaper3k等で本文・OGP画像を取得
- LangChain+OpenAIで
  - 本文から200字以内要約（summary）
  - より具体的なタグ抽出（labels: List[str]）
- Articleオブジェクトに格納
- save_articlesでDB保存（labelsはJSONB、thumbnail_urlも保存）
- 取得失敗/AI失敗はWARN/ERRORログ＋リトライorスキップ
- 同一記事のAI呼び出しはキャッシュ（Redis等）でコスト削減
- バッチ処理はCelery/RabbitMQ等でワーカープール化も検討

---

## 4. API（Express + TypeScript）

- `/api/articles` のSQL・型定義を `summary, labels, thumbnail_url` も返すよう修正
- labelsはDBからJSONB→string[]に変換
- any禁止：@typescript-eslint/no-explicit-any ルール厳守
- OpenAI APIキーは.envで管理（Vault等は不要）
- 入出力バリデーション（Zod等）
- ページネーション・ラベル絞り込みも将来的に追加可能な設計

---

## 5. フロント（Next.js + TypeScript）

- Article型に `summary: string, labels: string[], thumbnailUrl: string` 追加
- 記事一覧でsummary, labels, thumbnailも表示
- タグ風ラベル（rounded-full）、summaryは折りたたみ（Headless UI Disclosure）、サムネイルはカード上部
- サムネイル画像がない場合はプレースホルダー
- getStaticProps＋ISRで記事一覧をキャッシュ
- アクセシビリティ考慮（タグはbutton要素、aria-expanded等）

#### UI例

```tsx
<Card className="p-4 shadow rounded-xl">
  <img src={article.thumbnailUrl} alt="" className="w-full h-40 object-cover rounded-md" />
  <h2 className="mt-2 text-xl font-bold">{article.title}</h2>
  <div className="mt-1 flex flex-wrap gap-2">
    {article.labels.map(label => (
      <span key={label} className="px-2 py-1 bg-gray-200 rounded-full text-sm">
        {label}
      </span>
    ))}
  </div>
  <Disclosure>
    <Disclosure.Button className="mt-2 text-blue-600">Summary</Disclosure.Button>
    <Disclosure.Panel className="mt-1 text-gray-700">
      {article.summary}
    </Disclosure.Panel>
  </Disclosure>
</Card>
```

---

## 6. テスト計画

- Python: pytest + pytest-mockでLangChain/スクレイピングをモック
  - summaryが200字以内、labelsが非空配列、thumbnail_urlがURL形式をチェック
- TypeScript: JestでAPIレスポンス型検証
  - labelsがstring[]、summary/thumbnailUrlが含まれるか
- E2E: Playwrightで記事一覧ページのサムネ・タグ・折りたたみ動作を確認
- Lint/型安全: ESLint + Prettier + @typescript-eslint/no-explicit-any
- CI/CD: GitHub ActionsでLint→ユニット→統合→デプロイ自動化

---

## 7. 受け入れ基準・テスト要件

### 受け入れ基準

- すべての記事に200字以内のsummaryと、1つ以上の具体的なラベルが付与されている
- `/api/articles` のレスポンスにsummary, labels, thumbnailUrlが含まれる
- フロント記事一覧でsummary, labels, thumbnailが表示される
- バッチ処理でエラー時にログ出力される
- テスト雛形が存在し、LangChain/スクレイピング部分がモック可能
- TypeScript/型ヒントでany未使用
- サムネイル画像が取得できない場合はプレースホルダー表示

### テスト要件

- summaryが200字以内であること
- labelsが空配列でないこと
- thumbnail_urlがURL形式であること
- APIレスポンスの型が `{ id, title, url, source, created_at, summary, labels, thumbnailUrl }` であること
- フロントでsummary, labels, thumbnailが正しく表示されること
- バッチ処理で例外発生時にエラーログが出力されること
- テスト雛形でLangChain/スクレイピング呼び出しがモックされていること

---

## 8. 今後の拡張・運用

- ラベルマスターテーブルや多対多設計による検索性向上
- バッチ処理のワーカープール化・監視・アラート
- APIのGraphQL化やフィルタリング機能追加
- フロントのアクセシビリティ・パフォーマンス最適化
- CI/CDによる品質担保