// frontend/stores/topicStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { Article, TopicArticle, TopicResponse } from '@/types'; // 型定義をインポート

interface TopicState {
  id: number | null;
  title: string;
  summary: string; // DBの monthly_summary に対応
  articles: TopicArticle[]; // 表示順にソート済み
  activeTab: 'selection' | 'templateOutput' | 'preview';
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
  updateArticleCategory: (articleId: number, major: string | null, minor: string | null) => void;
  updateArticleOrder: (articleId: number, direction: 'up' | 'down') => void;
  // TODO: D&D用のアクション (例: setArticlesOrder)
  setActiveTab: (tab: TopicState['activeTab']) => void;
  loadTopic: (topicId: number) => Promise<void>;
  saveTopic: () => Promise<void>;
  generateSummary: () => Promise<void>;
  autoCategorizeArticle: (articleId: number) => Promise<void>;
  resetState: () => void; // 新規作成やアンマウント時に状態をリセット
}

const initialState: Omit<TopicState, 'loadTopic' | 'saveTopic' | 'generateSummary' | 'autoCategorizeArticle' | 'resetState' | 'setId' | 'setTitle' | 'setSummary' | 'addArticles' | 'removeArticle' | 'updateArticleCategory' | 'updateArticleOrder' | 'setActiveTab'> = {
    id: null,
    title: '',
    summary: '',
    articles: [],
    activeTab: 'selection',
    isLoading: false,
    isSaving: false,
    isGeneratingSummary: false,
    isCategorizing: {},
    error: null,
};

export const useTopicStore = create<TopicState>((set, get) => ({
  ...initialState,

  setId: (id) => set({ id }),
  setTitle: (title) => set({ title }),
  setSummary: (summary) => set({ summary }), // DBの monthly_summary に対応
  addArticles: (articlesToAdd) => {
    const currentArticles = get().articles;
    const existingIds = new Set(currentArticles.map(a => a.id));
    const newArticles = articlesToAdd
      .filter(a => !existingIds.has(a.id))
      .map((a, index) => ({
        ...a,
        displayOrder: currentArticles.length + index,
        categoryMajor: null, // DBの category_main に対応
        categoryMinor: null, // DBの category_minor に対応
      }));
    set({ articles: [...currentArticles, ...newArticles].sort((a, b) => a.displayOrder - b.displayOrder) });
  },
  removeArticle: (articleId) => set((state) => {
      const updatedArticles = state.articles
          .filter(a => a.id !== articleId)
          .map((a, index) => ({ ...a, displayOrder: index })); // 順序を再割り当て
      return { articles: updatedArticles };
  }),
  updateArticleCategory: (articleId, major, minor) => set((state) => ({
    articles: state.articles.map(a =>
      a.id === articleId ? { ...a, categoryMajor: major, categoryMinor: minor } : a
    )
  })),
  updateArticleOrder: (articleId, direction) => set((state) => {
      const articles = [...state.articles];
      const index = articles.findIndex(a => a.id === articleId);
      if (index === -1) return {};
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= articles.length) return {};
      // displayOrder を入れ替え
      const tempOrder = articles[index].displayOrder;
      articles[index].displayOrder = articles[targetIndex].displayOrder;
      articles[targetIndex].displayOrder = tempOrder;
      return { articles: articles.sort((a, b) => a.displayOrder - b.displayOrder) };
  }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  loadTopic: async (topicId) => {
    set({ isLoading: true, error: null });
    try {
      // API呼び出し (仮)
      const response = await axios.get<TopicResponse>(`/api/topics/${topicId}`);
      const { id, title, monthly_summary, articles } = response.data;
      set({
        id,
        title,
        summary: monthly_summary, // DBのカラム名に合わせる
        articles: articles.sort((a, b) => a.displayOrder - b.displayOrder),
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to load topic:", err);
      set({ isLoading: false, error: 'トピックの読み込みに失敗しました。' });
    }
  },
  saveTopic: async () => {
    const { id, title, summary, articles } = get();
    set({ isSaving: true, error: null });
    try {
      // API呼び出し (仮)
      const payload = {
          title,
          monthly_summary: summary, // DBのカラム名に合わせる
          articles: articles.map(({ id: articleId, displayOrder, categoryMajor, categoryMinor }) => ({ // id を articleId に変更
              articleId, // バックエンドの期待するキー名に合わせる (要確認)
              displayOrder,
              category_main: categoryMajor, // DBのカラム名に合わせる
              category_minor: categoryMinor // DBのカラム名に合わせる
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
      // TODO: 保存成功の通知 (Snackbarなど)
    } catch (err) {
      console.error("Failed to save topic:", err);
      set({ isSaving: false, error: 'トピックの保存に失敗しました。' });
    }
  },
  generateSummary: async () => {
    const articleIds = get().articles.map(a => a.id);
    if (articleIds.length === 0) return;
    set({ isGeneratingSummary: true, error: null });
    try {
      // API呼び出し (仮)
      const response = await axios.post<{ summary: string }>('/api/summarize', { articleIds });
      set({ summary: response.data.summary, isGeneratingSummary: false });
    } catch (err) {
      console.error("Failed to generate summary:", err);
      set({ isGeneratingSummary: false, error: 'まとめの生成に失敗しました。' });
    }
  },
  autoCategorizeArticle: async (articleId) => {
    const article = get().articles.find(a => a.id === articleId);
    if (!article) return;
    set(state => ({ isCategorizing: { ...state.isCategorizing, [articleId]: true }, error: null }));
    try {
      // API呼び出し (仮)
      // バックエンドの期待する形式に合わせて article 情報 (title, summary など) を送信
      const response = await axios.post<{ category_main: string; category_minor: string }>('/api/categorize', {
          article: { title: article.title, summary: article.summary } // 例
      });
      // category_main, category_minor を受け取る想定
      get().updateArticleCategory(articleId, response.data.category_main, response.data.category_minor);
    } catch (err) {
      console.error(`Failed to categorize article ${articleId}:`, err);
      set({ error: `記事 ${articleId} の自動分類に失敗しました。` });
    } finally {
      set(state => ({ isCategorizing: { ...state.isCategorizing, [articleId]: false } }));
    }
  },
  resetState: () => set(initialState),
}));