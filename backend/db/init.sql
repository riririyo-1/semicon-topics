-- articlesテーブル
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE articles ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS labels JSONB;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published TIMESTAMP;

-- topicsテーブル
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  month VARCHAR(7) NOT NULL, -- 例: "2025-05"
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monthly_summary TEXT,
  template_html TEXT
);

-- jobsテーブル
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  progress INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- topics articlesテーブル：リレーション
CREATE TABLE IF NOT EXISTS topics_articles (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  category_main VARCHAR(50),
  category_sub JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (topic_id, article_id)
);

-- 既存のテーブル構造が異なる場合は列名を変更する
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'topics_articles' AND column_name = 'topics_id'
    ) THEN
        ALTER TABLE topics_articles RENAME COLUMN topics_id TO topic_id;
    END IF;
END $$;

-- 既存のテーブル構造が異なる場合は不足カラムを追加
ALTER TABLE topics_articles ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE topics_articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- PostgreSQLのバージョンによってはON UPDATE CURRENT_TIMESTAMPが動作しないので代わりにトリガーを使用する
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- topicsテーブルの更新日時を自動更新
CREATE TRIGGER update_topics_timestamp
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- jobsテーブルの更新日時を自動更新
DROP TRIGGER IF EXISTS update_jobs_timestamp ON jobs;
CREATE TRIGGER update_jobs_timestamp
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
