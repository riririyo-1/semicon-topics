// frontend/stores/topicStore.ts
import { create } from 'zustand';
import axios from 'axios';

// 記事の型定義
export interface Article {
  id: number;
  title: string;
  url: string;
  source: string;
  summary: string;
  published: string;
  labels: string[];
  thumbnailUrl?: string;
}

// TOPICSに含まれる記事の型定義（カテゴリなどの追加情報を含む）
export interface TopicArticle extends Article {
  displayOrder: number;
  categoryMajor: string | null;
  categoryMinor: string[] | null;
}

// API レスポンスの型定義
interface TopicResponse {
  id: number;
  title: string;
  monthly_summary: string;
  articles: TopicArticle[];
}

// カテゴリ更新用パラメータの型定義
interface CategoryUpdateParams {
  categoryMajor?: string;
  categoryMinor?: string[];
}

// Store の状態の型定義
interface TopicState {
  id: number | null;
  title: string;
  summary: string; // DBの monthly_summary に対応
  articles: TopicArticle[]; // 表示順にソート済み
  activeTab: number; // タブのインデックス (0: 選択, 1: テンプレート出力, 2: プレビュー)
  isLoading: boolean;
  isSaving: boolean;
  isGeneratingSummary: boolean;
  isCategorizing: Record<number, boolean>; // 記事IDごとの分類中フラグ
  error: string | null;

  // --- アクション ---
  setId: (id: number | null) => void;
  setTitle: (title: string) => void;
  setSummary: (summary: string) => void;
  addArticles: (articlesToAdd: Article[]) => void;
  removeArticle: (articleId: number) => void;
  updateArticleCategory: (articleId: number, params: CategoryUpdateParams) => void;
  updateArticleOrder: (articleId: number, newOrder: number) => void;
  setActiveTab: (tab: number) => void;
  loadTopic: (topicId: number) => Promise<void>;
  saveTopic: () => Promise<void>;
  generateSummary: () => Promise<void>;
  autoCategorizeArticle: (articleId: number) => Promise<void>;
  resetState: () => void; // 新規作成やアンマウント時に状態をリセット
}

// 初期状態
const initialState: Omit<TopicState, 'loadTopic' | 'saveTopic' | 'generateSummary' | 'autoCategorizeArticle' | 'resetState' | 'setId' | 'setTitle' | 'setSummary' | 'addArticles' | 'removeArticle' | 'updateArticleCategory' | 'updateArticleOrder' | 'setActiveTab'> = {
    id: null,
    title: '',
    summary: '',
    articles: [],
    activeTab: 0, // 最初のタブ（記事選択）
    isLoading: false,
    isSaving: false,
    isGeneratingSummary: false,
    isCategorizing: {},
    error: null,
};

// Zustand ストア作成
export const useTopicStore = create<TopicState>((set, get) => ({
  ...initialState,

  setId: (id) => set({ id }),
  setTitle: (title) => set({ title }),
  setSummary: (summary) => set({ summary }), // DBの monthly_summary に対応
  
  // 記事追加アクション
  addArticles: (articlesToAdd) => {
    const currentArticles = get().articles;
    const existingIds = new Set(currentArticles.map(a => a.id));
    const newArticles = articlesToAdd
      .filter(a => !existingIds.has(a.id))
      .map((a, index) => ({
        ...a,
        displayOrder: currentArticles.length + index,
        categoryMajor: null, 
        categoryMinor: [], // 空配列で初期化
      }));
    set({ articles: [...currentArticles, ...newArticles].sort((a, b) => a.displayOrder - b.displayOrder) });
  },
  
  // 記事削除アクション
  removeArticle: (articleId) => set((state) => {
    const updatedArticles = state.articles
      .filter(a => a.id !== articleId)
      .map((a, index) => ({ ...a, displayOrder: index })); // 順序を再割り当て
    return { articles: updatedArticles };
  }),
  
  // カテゴリ更新アクション（新しいインターフェースに合わせて修正）
  updateArticleCategory: (articleId, params) => set((state) => ({
    articles: state.articles.map(a =>
      a.id === articleId ? { 
        ...a, 
        categoryMajor: params.categoryMajor !== undefined ? params.categoryMajor : a.categoryMajor,
        categoryMinor: params.categoryMinor !== undefined ? params.categoryMinor : a.categoryMinor 
      } : a
    )
  })),
  
  // 記事順序変更アクション（新しいインターフェースに合わせて修正）
  updateArticleOrder: (articleId, newOrder) => set((state) => {
    const articles = [...state.articles];
    const index = articles.findIndex(a => a.id === articleId);
    if (index === -1) return {};
    
    const article = articles[index];
    if (article.displayOrder === newOrder) return {}; // 順序が同じなら何もしない
    
    // 他の記事の順序も更新
    articles.forEach(a => {
      if (a.id === articleId) {
        a.displayOrder = newOrder;
      } else if (
        (a.displayOrder >= newOrder && a.displayOrder < article.displayOrder) || 
        (a.displayOrder <= newOrder && a.displayOrder > article.displayOrder)
      ) {
        // 移動範囲内の記事の順序を調整
        a.displayOrder += (article.displayOrder > newOrder ? 1 : -1);
      }
    });
    
    return { articles: articles.sort((a, b) => a.displayOrder - b.displayOrder) };
  }),
  
  // アクティブタブ設定アクション
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // TOPICS読み込みアクション
  loadTopic: async (topicId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get<TopicResponse>(`/api/topics/${topicId}`);
      const { id, title, monthly_summary, articles } = response.data;
      set({
        id,
        title,
        summary: monthly_summary || '', // null の場合は空文字を設定
        articles: (articles || []).map(article => ({
          ...article,
          categoryMinor: article.categoryMinor || [] // null の場合は空配列を設定
        })).sort((a, b) => a.displayOrder - b.displayOrder),
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to load topic:", err);
      set({ isLoading: false, error: 'トピックの読み込みに失敗しました。' });
    }
  },
  
  // TOPICS保存アクション
  saveTopic: async () => {
    const { id, title, summary, articles } = get();
    if (!title) {
      set({ error: 'タイトルは必須です。' });
      return;
    }
    
    set({ isSaving: true, error: null });
    try {
      const payload = {
        title,
        monthly_summary: summary,
        articles: articles.map(({ id: articleId, displayOrder, categoryMajor, categoryMinor }) => ({ // id を articleId に変更
          article_id: articleId, // バックエンドの期待するキー名に合わせる
          display_order: displayOrder,
          category_main: categoryMajor || '未分類', // nullの場合は未分類
          category_sub: categoryMinor || [] // nullの場合は空配列
        }))
      };
      
      let response;
      if (id) {
        // 更新
        response = await axios.put(`/api/topics/${id}`, payload);
      } else {
        // 新規作成
        response = await axios.post('/api/topics', payload);
        set({ id: response.data.id }); // 新規作成後にIDをセット
      }
      set({ isSaving: false });
      // ここでUI通知を表示する場合、コンポーネント側で処理
    } catch (err) {
      console.error("Failed to save topic:", err);
      set({ 
        isSaving: false, 
        error: err.response?.data?.error || 'トピックの保存に失敗しました。' 
      });
    }
  },
  
  // 月次まとめ生成アクション
  generateSummary: async () => {
    const { id, articles } = get();
    if (!id || articles.length === 0) {
      set({ error: 'TOPICSが保存されていないか、記事が選択されていません。' });
      return;
    }
    
    set({ isGeneratingSummary: true, error: null });
    try {
      // /api/topics/{id}/summary エンドポイントを呼び出し
      const response = await axios.post<{ monthly_summary: string }>(`/api/topics/${id}/summary`);
      set({ summary: response.data.monthly_summary, isGeneratingSummary: false });
    } catch (err) {
      console.error("Failed to generate summary:", err);
      set({ 
        isGeneratingSummary: false, 
        error: err.response?.data?.error || 'まとめの生成に失敗しました。' 
      });
    }
  },
  
  // 記事カテゴリ自動分類アクション
  autoCategorizeArticle: async (articleId) => {
    const { id } = get();
    if (!id) {
      set({ error: 'TOPICSが保存されていません。' });
      return;
    }
    
    set(state => ({ isCategorizing: { ...state.isCategorizing, [articleId]: true }, error: null }));
    try {
      // /api/topics/{id}/article/{articleId}/categorize エンドポイントを呼び出し
      const response = await axios.post<{ category_main: string; category_sub: string[] }>(
        `/api/topics/${id}/article/${articleId}/categorize`
      );
      
      get().updateArticleCategory(articleId, {
        categoryMajor: response.data.category_main,
        categoryMinor: response.data.category_sub
      });
    } catch (err) {
      console.error(`Failed to categorize article ${articleId}:`, err);
      set({ error: `記事の自動分類に失敗しました。` });
    } finally {
      set(state => ({ isCategorizing: { ...state.isCategorizing, [articleId]: false } }));
    }
  },
  
  // 状態リセットアクション
  resetState: () => set(initialState),
}));