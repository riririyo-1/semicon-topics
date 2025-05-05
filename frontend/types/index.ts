// frontend/types/index.ts

// APIから取得する記事の基本形
export interface Article {
  id: number;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  labels: string[] | null; // JSONBは文字列配列として扱うことが多い
  thumbnail_url: string | null; // DBのカラム名に合わせる
  published: string | null; // ISO 8601形式の文字列など
  created_at: string; // DBのカラム名に合わせる
}

// TOPICSリストで表示する情報の型
export interface TopicListItem {
  id: number;
  title: string;
  updated_at: string; // DBのカラム名に合わせる
  // 必要に応じて他のフィールド (例: createdAt) も追加
}

// ストア内で管理する、TOPICS配信に含まれる記事の型
export interface TopicArticle extends Article {
  displayOrder: number;
  categoryMajor: string | null; // DBのカラム名に合わせる (category_main)
  categoryMinor: string | null; // DBのカラム名に合わせる (category_minor)
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
