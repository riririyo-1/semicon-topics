# フロントエンド TOPICS配信ページ 設計案

## 1. ファイル構成案

Next.js App Router の規約に基づき、以下のファイル構成を提案します。

```
frontend/
  app/
    topics/
      page.tsx                 # TOPICSリストページのルート
      components/              # TOPICSリストページ用コンポーネント
        TopicsList.tsx         # TOPICSリスト表示コンポーネント
        CreateTopicButton.tsx  # 新規作成ボタンコンポーネント
        TopicSearch.tsx        # TOPICSオートコンプリート検索コンポーネント
      [id]/                    # 特定のTOPICS配信用ディレクトリ
        edit/
          page.tsx             # TOPICS編集ページのルート
          components/          # TOPICS編集ページ用コンポーネント
            EditTabs.tsx         # 3つのタブを管理するコンポーネント
            ArticleSelectionTab.tsx # 「TOPICS選択」タブコンポーネント
              ArticleFilter.tsx    # 記事絞り込みフィルター
              ArticleTable.tsx     # 記事一覧（表形式）
              ArticleCardList.tsx  # 記事一覧（カード形式）
              SelectedTopicsList.tsx # 選択された記事リスト
              ArticleSearch.tsx     # 記事オートコンプリート検索コンポーネント
            TemplateOutputTab.tsx # 「テンプレート出力」タブコンポーネント
              SummaryEditor.tsx    # まとめ編集エリア
              TopicItemEditor.tsx  # 各記事の編集（カテゴリ選択など）
            PreviewTab.tsx       # 「プレビュー」タブコンポーネント
  stores/                      # Zustand ストアディレクトリ (新規作成)
    topicStore.ts              # TOPICS編集用ストア
  types/                       # 型定義ディレクトリ (必要に応じて)
    index.ts                   # 共通の型定義
```

## 2. 各ページの機能設計

### a. TOPICSリストページ (`/topics`)

-   **`frontend/app/topics/page.tsx`**:
    -   **データ取得:** `useSWR` または React Query (`useQuery`) を使用し、`/api/topics` からTOPICSリスト (`Topic[]`) を取得。ローディング状態 (`isLoading`)、エラー状態 (`error`) をハンドリング。
    -   **コンポーネント:**
        -   `CreateTopicButton`: 新規作成ページ (`/topics/new/edit`) へのリンクボタン。
        -   `TopicsList`: 取得した `topics` データを渡す。
    -   **UI:** ページタイトル (例: `Typography variant="h4"`)、`CreateTopicButton`、`TopicsList` を表示。`isLoading` 中は `CircularProgress` を表示。`error` 時は `Alert` でメッセージ表示。
-   **`frontend/app/topics/components/TopicsList.tsx`**:
    -   **Props:** `topics: Topic[]` (例: `interface Topic { id: number; title: string; createdAt: string; }`)
    -   **機能:** `topics` 配列をマップし、各TOPICSを `ListItem` や `Card` で表示。
    -   **UI:** 各項目は `next/link` で `/topics/[id]/edit` へリンク。MUI `List` や `Grid` を使用。各項目に最終更新日時なども表示すると良い。
    -   **スタイリング:** 既存のリスト表示スタイルを踏襲。
-   **`frontend/app/topics/components/CreateTopicButton.tsx`**:
    -   **機能:** `/topics/new/edit` へ遷移する `Link` コンポーネントを内包したMUI `Button` (`variant="contained"`, `startIcon={<AddIcon />}` など)。

### b. TOPICS配信編集ページ (`/topics/[id]/edit`)

-   **`frontend/app/topics/[id]/edit/page.tsx`**:
    -   **ルーティング:** `useParams` フック (`next/navigation`) で `id` を取得。
    -   **状態管理:** `useTopicStore` フックを使用。
    -   **データ取得/初期化:** `useEffect` を使用。
        -   コンポーネントマウント時: `id` が `'new'` なら `resetState()` を呼び出し、そうでなければ `loadTopic(Number(id))` を呼び出す。
        -   コンポーネントアンマウント時: `resetState()` を呼び出してストアをクリーンアップ。
    -   **コンポーネント:** `EditTabs` をレンダリング。ストアから `isLoading`, `error` を取得し、`CircularProgress` や `Alert` を表示。
-   **`frontend/app/topics/[id]/edit/components/EditTabs.tsx`**:
    -   **状態管理:** `useTopicStore` から `activeTab`, `setActiveTab`, `saveTopic`, `isSaving`, `error` を取得。
    -   **UI:** MUI `Tabs` コンポーネント (`value={activeTab}`, `onChange={(_, newValue) => setActiveTab(newValue)}`)。各 `Tab` (`label`, `value`) に対応するコンポーネント (`ArticleSelectionTab`, `TemplateOutputTab`, `PreviewTab`) を条件付きレンダリング。ページ上部または下部に保存ボタン (MUI `LoadingButton` from `@mui/lab`, `loading={isSaving}`, `onClick={saveTopic}`) を配置。
    -   **エラー表示:** `error` があれば `Alert` を表示。

### c. TOPICS選択タブ (`ArticleSelectionTab.tsx`)

-   **状態管理:** `useTopicStore` から `addArticles` を取得。ローカルステート (`useState`) でフィルター条件 (`filters`)、表示形式 (`viewMode: 'table' | 'card'`)、左側リストの選択状態 (`selectedArticleIds: Set<number>`)、取得した記事リスト (`articles: Article[]`)、ローディング状態 (`isArticleLoading`)、エラー状態 (`articleError`) を管理。
-   **レイアウト:** MUI `Grid` (`container`, `spacing={2}`) で左右分割。中央に矢印ボタン用の `Grid item xs={1}`。
-   **左側 (記事一覧):**
    -   `ArticleFilter.tsx`:
        -   **Props:** `initialFilters`, `onFilterChange: (newFilters) => void`
        -   **UI:** 日付範囲 (`DateRangePicker` or `DatePicker` x2), ラベル (`Autocomplete multiple`)
        -   **機能:** フィルター変更時に `onFilterChange` を呼び出す。debounce を適用推奨。
    -   `ArticleSearch.tsx`:
        -   **Props:** `onArticleSelect: (article: Article) => void`
        -   **UI:** MUI `Autocomplete` + `TextField`
        -   **機能:** 記事タイトルやキーワードの入力で即時検索 (debounce 適用)、選択時に `onArticleSelect` を呼び出す
        -   **データ取得:** 入力文字列変更時に `/api/articles/search?q=検索文字列` を叩いて候補を取得
    -   表示形式切り替え: MUI `ToggleButtonGroup` (`value={viewMode}`, `onChange={(_, newMode) => setViewMode(newMode)}`)。
    -   記事リスト表示:
        -   **データ取得:** `filters` が変更されたら `useEffect` 内で `/api/articles` を叩く (SWRや独自fetch関数)。ページネーションも考慮 (`page`, `limit`)。結果を `articles` state にセット。
        -   `isArticleLoading` 中は `Skeleton` や `CircularProgress` を表示。
        -   `articleError` 時は `Alert` を表示。
        -   `viewMode` に応じて `ArticleTable` または `ArticleCardList` をレンダリング。
    -   `ArticleTable.tsx` / `ArticleCardList.tsx`:
        -   **Props:** `articles: Article[]`, `selectedArticleIds: Set<number>`, `onSelectionChange: (articleId: number) => void`
        -   **UI (Table):** MUI `Table`, `Checkbox`。
        -   **UI (Card):** MUI `Grid`, `Card`, `CardActionArea`, `CardMedia`, `Checkbox`。ホバーエフェクト実装 (後述)。
        -   **機能:** チェックボックス/カードクリック時に `onSelectionChange` を呼び出し、`selectedArticleIds` state を更新。
-   **中央:**
    -   MUI `IconButton` (`ArrowForwardIcon`)。`disabled` は `selectedArticleIds.size === 0`。
    -   **機能:** クリック時に `articles` state から `selectedArticleIds` に含まれる記事オブジェクトを探し、`useTopicStore` の `addArticles` アクションに渡す。処理後、`selectedArticleIds` をクリア。
-   **右側 (選択済み記事):**
    -   `SelectedTopicsList.tsx`:
        -   **状態管理:** `useTopicStore` から `articles` (選択済みリスト), `removeArticle`, `updateArticleOrder` (または `setArticlesOrder` for D&D) を取得。
        -   **UI:** MUI `List` と `ListItem`。各項目にタイトル、削除ボタン (`IconButton` with `DeleteIcon`)。オプションで上下移動ボタンまたはドラッグハンドル。
        -   **機能:** 削除ボタンクリックで `removeArticle`。移動ボタン/D&D完了で `updateArticleOrder`/`setArticlesOrder`。
-   **下部:**
    -   「配信テンプレート出力ボタン」: MUI `Button`。クリック時に `useTopicStore` の `setActiveTab('templateOutput')` を呼び出す。

### d. テンプレート出力タブ (`TemplateOutputTab.tsx`)

-   **状態管理:** `useTopicStore` から `summary`, `articles`, `setSummary`, `updateArticleCategory`, `generateSummary`, `autoCategorizeArticle`, `isGeneratingSummary`, `isCategorizing`, `error` を取得。
-   **上部 (まとめ欄):**
    -   `SummaryEditor.tsx`:
        -   **UI:** MUI `TextField` (multiline, `value={summary}`, `onChange={(e) => setSummary(e.target.value)}`)。「LLM自動まとめ文章生成」ボタン (MUI `LoadingButton`, `loading={isGeneratingSummary}`, `onClick={generateSummary}`)。
        -   **エラー表示:** `error` があれば `Alert`。
-   **中央 (記事リスト):**
    -   ストアの `articles` をマップして `TopicItemEditor` を表示 (順序は `displayOrder` に従う)。
    -   `TopicItemEditor.tsx`:
        -   **Props:** `article: TopicArticle` (ストア内の型)
        -   **UI:** 記事情報表示 (`Typography`, `Link`)。大カテゴリ・小カテゴリ `Select`。LLM自動分類ボタン (MUI `LoadingButton`, `loading={isCategorizing[article.id]}`, `onClick={() => autoCategorizeArticle(article.id)}`)。
        -   **機能:** カテゴリ `Select` の `onChange` で `updateArticleCategory` を呼び出す。
        -   **カテゴリ選択肢:** 事前に定義したリスト (`const CATEGORIES = { major: [...], minor: [...] }`) またはAPIから取得したリストを使用。
-   **下部:**
    -   「プレビュー出力ボタン」: MUI `Button`。クリック時に `useTopicStore` の `setActiveTab('preview')` を呼び出す。

### e. プレビュータブ (`PreviewTab.tsx`)

-   **状態管理:** `useTopicStore` から `title`, `summary`, `articles` を取得。
-   **機能:** ストアデータを元に、指定されたHTMLフォーマットをReactコンポーネントとしてレンダリング。記事を `categoryMajor` でグループ化し、`displayOrder` でソートして表示。
-   **UI:** MUI `Container`, `Typography`, `List`, `ListItem`, `Divider` などを使用してプレビューを構築。スタイルは `sx` prop や `styled` で調整。

## 3. APIエンドポイント (フロントエンド `/app/api/`)

-   **`GET /api/topics`**:
    -   レスポンス例: `[{ id: 1, title: "1月TOPICS配信", updatedAt: "..." }, ...]`
-   **`POST /api/topics`**:
    -   リクエスト例: `{ title: "新規TOPICS", summary: "...", articles: [{ articleId: 1, displayOrder: 0, categoryMajor: "...", categoryMinor: "..." }, ...] }`
    -   レスポンス例: `{ id: 123, title: "新規TOPICS", ... }` (作成されたTopicオブジェクト)
-   **`GET /api/topics/[id]`**:
    -   レスポンス例: `{ id: 1, title: "1月TOPICS配信", summary: "...", articles: [{ id: 5, displayOrder: 0, categoryMajor: "...", categoryMinor: "...", title: "記事タイトル", url:"...", source:"...", summary:"...", published:"...", thumbnailUrl:"..." }, ...], createdAt: "...", updatedAt: "..." }` (記事情報も含む)
-   **`PUT /api/topics/[id]`**:
    -   リクエスト例: (POSTと同様の形式)
    -   レスポンス例: `{ id: 1, title: "更新後TOPICS", ... }` (更新されたTopicオブジェクト)
-   **`GET /api/articles`**:
    -   クエリパラメータ: `startDate`, `endDate`, `labels[]`, `page`, `limit`
    -   レスポンス例: `{ items: [{ id: 1, title: "記事タイトル", ... }], totalCount: 123, page: 1, limit: 20 }`
-   **`GET /api/articles/search`**:
    -   クエリパラメータ: `q` (検索キーワード)
    -   レスポンス例: `[{ id: 1, title: "記事タイトル", ... }, ...]` (検索結果をオートコンプリート用に最大10件程度)
-   **`GET /api/topics/search`**:
    -   クエリパラメータ: `q` (検索キーワード)
    -   レスポンス例: `[{ id: 1, title: "1月TOPICS配信", ... }, ...]` (検索結果をオートコンプリート用に最大10件程度)

## 4. オートコンプリート機能

### a. トピック検索

-   **コンポーネント:** `TopicSearch.tsx`
-   **機能:**
    -   タイトル、キーワードでトピックをインクリメンタルサーチ
    -   検索結果から選択するとそのトピック詳細ページに遷移
    -   最近作成されたトピックをデフォルトで表示
-   **UI実装:**
    ```tsx
    // TopicSearch.tsx
    import { useState, useEffect } from 'react';
    import { Autocomplete, TextField, CircularProgress } from '@mui/material';
    import { useRouter } from 'next/navigation';
    
    export const TopicSearch = () => {
      const [open, setOpen] = useState(false);
      const [options, setOptions] = useState([]);
      const [loading, setLoading] = useState(false);
      const [inputValue, setInputValue] = useState('');
      const router = useRouter();
      
      useEffect(() => {
        let active = true;
        
        if (inputValue === '') {
          setOptions([]);
          return undefined;
        }
        
        setLoading(true);
        
        // 検索APIを呼び出す (500msのdebounce)
        const timeoutId = setTimeout(() => {
          fetch(`/api/topics/search?q=${encodeURIComponent(inputValue)}`)
            .then(response => response.json())
            .then(data => {
              if (active) {
                setOptions(data);
                setLoading(false);
              }
            })
            .catch(() => {
              setLoading(false);
            });
        }, 500);
        
        return () => {
          active = false;
          clearTimeout(timeoutId);
        };
      }, [inputValue]);
      
      return (
        <Autocomplete
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          inputValue={inputValue}
          onInputChange={(_, newValue) => setInputValue(newValue)}
          options={options}
          getOptionLabel={(option) => option.title}
          loading={loading}
          onChange={(_, newValue) => {
            if (newValue) {
              router.push(`/topics/${newValue.id}/edit`);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="トピックを検索"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      );
    };
    ```

### b. 記事検索 (TOPICS編集時)

-   **コンポーネント:** `ArticleSearch.tsx`
-   **機能:**
    -   タイトル、キーワードで記事をインクリメンタルサーチ
    -   検索結果から選択するとその記事をトピックに追加
    -   表形式・カード形式のリスト表示と連携
-   **実装上の考慮点:**
    -   検索入力時にはdebounceを適用し、APIリクエスト数を最適化
    -   ユーザー入力で400ms程度の遅延を持たせてから検索APIを呼び出す
    -   既に選択済みの記事は検索結果から除外または区別表示
    -   モバイル画面でも操作しやすいUI設計
