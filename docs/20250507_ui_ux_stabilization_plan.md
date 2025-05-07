# 2025-05-07 UI/UX安定化・改善計画

---

## 1. 現状分析と課題マッピング

### UI全体のズレ・余白・レイアウト
- [`frontend/app/layout.tsx`](frontend/app/layout.tsx)
- [`frontend/theme.ts`](frontend/theme.ts)

### 記事一覧・要約欄・ページネーション
- [`frontend/app/articles/page.tsx`](frontend/app/articles/page.tsx)
- [`frontend/app/topics/[id]/edit/components/ArticleTable.tsx`](frontend/app/topics/[id]/edit/components/ArticleTable.tsx)
- [`frontend/app/topics/[id]/edit/components/ArticleCardList.tsx`](frontend/app/topics/[id]/edit/components/ArticleCardList.tsx)

### TOPICS配信管理画面の検索欄・ラベル・プレビュー
- [`frontend/app/topics/[id]/edit/components/ArticleSearch.tsx`](frontend/app/topics/[id]/edit/components/ArticleSearch.tsx)
- [`frontend/app/topics/[id]/edit/components/ArticleFilter.tsx`](frontend/app/topics/[id]/edit/components/ArticleFilter.tsx)
- [`frontend/app/topics/[id]/edit/components/PreviewTab.tsx`](frontend/app/topics/[id]/edit/components/PreviewTab.tsx)

---

## 2. 改善・修正タスク一覧

### 2.1 UI全体のズレ・余白・レイアウト調整
- 余白（padding/margin）を現状より狭く統一
- レスポンシブ/最大幅/高さの見直し
- DrawerやBoxの配置・padding/marginの統一
- テーマファイルでのグローバルな余白・色・フォント調整

### 2.2 記事一覧の要約欄幅拡大・ページネーション追加
- 要約欄（Table/カード）のmaxWidthやTypographyのsx調整
- ページネーションUI（Material-UIのPagination等）を追加し、記事リストのslice表示
- 1ページあたり20件、詳細表示（ページ番号＋前後ボタン）

### 2.3 TOPICS配信管理画面のバグ修正
- 検索欄（ArticleSearch.tsx）：候補がno optionになる→API/ストアからの取得ロジック修正
- 記事絞り込みラベル（ArticleFilter.tsx）：onChange/props伝播/ラベル取得ロジック修正
- プレビュー画面（PreviewTab.tsx）：大分類（categoryMajor）を正しく表示

---

## 3. 実装イメージ（Mermaid図）

```mermaid
flowchart TD
    A[UI全体レイアウト調整] --> B[layout.tsx/theme.ts]
    C[記事一覧ページ改善] --> D[page.tsx(articles)]
    D --> E[要約欄幅拡大]
    D --> F[ページネーション追加]
    G[TOPICS配信管理画面バグ修正] --> H[ArticleSearch.tsx: 検索候補]
    G --> I[ArticleFilter.tsx: ラベル絞り込み]
    G --> J[PreviewTab.tsx: 大分類表示]
```

---

## 4. 進め方

1. **UI全体のレイアウト・余白調整**  
   - [`layout.tsx`](frontend/app/layout.tsx)・[`theme.ts`](frontend/theme.ts)を中心に、全体の余白・最大幅・高さ・色・フォントを統一
   - 余白は現状より狭く調整

2. **記事一覧ページの要約欄幅拡大・ページネーション追加**  
   - [`articles/page.tsx`](frontend/app/articles/page.tsx)・[`ArticleTable.tsx`](frontend/app/topics/[id]/edit/components/ArticleTable.tsx)の要約欄sx修正
   - Material-UIのPagination導入、sliceで表示件数制御（1ページ20件、詳細表示）

3. **TOPICS配信管理画面のバグ修正**  
   - [`ArticleSearch.tsx`](frontend/app/topics/[id]/edit/components/ArticleSearch.tsx)：候補取得ロジック修正
   - [`ArticleFilter.tsx`](frontend/app/topics/[id]/edit/components/ArticleFilter.tsx)：ラベルonChange/props伝播修正
   - [`PreviewTab.tsx`](frontend/app/topics/[id]/edit/components/PreviewTab.tsx)：大分類(categoryMajor)の表示追加

---

## 5. 補足・備考

- UIの余白は現状より狭く、見やすさと情報密度のバランスを重視
- 記事一覧は1ページ20件、ページネーションは詳細表示（ページ番号＋前後ボタン）
- 実装時は各コンポーネントの責務を明確にし、再利用性・保守性を意識

---

## 6. TOPICS配信タブの追加安定化方針（2025-05-07追記）

### 6.1 TOPIC検索欄の改善
- 検索候補が「no options」とならず、入力時に候補が表示されるようAPI・ロジックを修正
- 検索欄の横に「検索」ボタンを追加し、明示的な検索も可能に

### 6.2 記事絞り込みUIの改善
- ラベルと日付の入力欄を上下2段に分けて配置し、視認性を向上
- ラベルを選択した際、選択済みラベルが明示的に表示されるようにUIを調整

### 6.3 テンプレート出力画面のダークモード対応
- ダークモード時に文字色が黒で見えなくなる不具合を修正し、配色を最適化

### 6.4 カテゴリ自動分類・選択UIの見直し
- LLMによるカテゴリ自動分類の動作不良を調査・修正
- 小カテゴリも大カテゴリと同様に「単一選択（複数不可）」にUI/ロジックを変更

---

### 7. 安定的動作までの進行フロー

1. **現状UI/ロジックの再調査・課題洗い出し**
2. **各課題ごとに詳細設計・修正方針の明文化**
3. **実装・テスト（UI/UX・API・LLM分類含む）**
4. **ユーザビリティ・デザインの最終調整**
5. **コードリファクタ・ドキュメント整備**
6. **本番環境での動作確認・リリース**

---

責任を持って安定的な動作・実用品質まで仕上げることを本方針に明記します。