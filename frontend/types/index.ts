// frontend/types/index.ts

// APIから取得する記事の基本形
export interface Article {
  id: number;
  title: string;
  url: string;
  published: string; // publishedAt から変更
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  summary?: string;
  tags?: string[]; // store の labels に対応
  source?: string;
}

// TOPICSリストで表示する情報の型
export interface TopicListItem {
  id: number;
  title: string;
  updated_at: string; // DBのカラム名に合わせる
  // 必要に応じて他のフィールド (例: createdAt) も追加
}

// ストア内で管理する、TOPICS配信に含まれる記事の型
export interface TopicArticle {
  id: number;
  title: string;
  url: string;
  source?: string;
  summary?: string;
  labels?: string[];
  thumbnailUrl?: string;
  published?: string;
  displayOrder: number; // ストアで管理される
  categoryMajor?: string;
  categoryMinor?: string[];
}

// APIレスポンスの型 (GET /api/topics/[id])
export interface TopicResponse {
  id: number;
  title: string;
  monthly_summary: string; // DBのカラム名に合わせる
  articles: TopicArticle[]; // バックエンドが整形して返す想定
  created_at: string;
  updated_at: string;
}

// APIレスポンスの型 (GET /api/articles)
export interface ArticlesApiResponse {
    articles: Article[];
    totalPages: number; // ページネーション用
    // 必要に応じて currentPage なども追加
}

export interface ArticleFilters {
  startDate: string | null;
  endDate: string | null;
  tags: string[];
}
