import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import axios from "axios";

const app = express();
const port = 4000;

// CORSを許可（全許可、必要に応じて調整）
app.use(cors());
app.use(express.json());

// Postgres接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// /api/articles エンドポイント
app.get("/api/articles", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 0;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = page * limit;

    // 検索・フィルタ用クエリパラメータ
    const keyword = (req.query.keyword as string) || "";
    const source = (req.query.source as string) || "";
    const tag = (req.query.tag as string) || "";
    const dateFrom = (req.query.date_from as string) || "";
    const dateTo = (req.query.date_to as string) || "";
    // PESTタグ（複数指定可, カンマ区切り）
    const pestP = (req.query.pest_p as string) || "";
    const pestE = (req.query.pest_e as string) || "";
    const pestS = (req.query.pest_s as string) || "";
    const pestT = (req.query.pest_t as string) || "";

    // WHERE句動的生成
    const where: string[] = [];
    const params: any[] = [limit, offset];
    let paramIdx = 3;

    if (keyword) {
      where.push(`(title ILIKE $${paramIdx} OR summary ILIKE $${paramIdx} OR source ILIKE $${paramIdx})`);
      params.push(`%${keyword}%`);
      paramIdx++;
    }
    if (source) {
      where.push(`source = $${paramIdx}`);
      params.push(source);
      paramIdx++;
    }
    if (tag) {
      where.push(`(labels::text ILIKE $${paramIdx})`);
      params.push(`%${tag}%`);
      paramIdx++;
    }
    if (dateFrom) {
      where.push(`created_at >= $${paramIdx}`);
      params.push(dateFrom);
      paramIdx++;
    }
    if (dateTo) {
      where.push(`created_at <= $${paramIdx}`);
      params.push(dateTo);
      paramIdx++;
    }

    // PESTタグごとに配列一致
    if (pestP) {
      const arr = pestP.split(",").map((v) => v.trim()).filter((v) => v);
      if (arr.length > 0) {
        where.push(`(pest_tags->'P') ?| $${paramIdx}`);
        params.push(arr);
        paramIdx++;
      }
    }
    if (pestE) {
      const arr = pestE.split(",").map((v) => v.trim()).filter((v) => v);
      if (arr.length > 0) {
        where.push(`(pest_tags->'E') ?| $${paramIdx}`);
        params.push(arr);
        paramIdx++;
      }
    }
    if (pestS) {
      const arr = pestS.split(",").map((v) => v.trim()).filter((v) => v);
      if (arr.length > 0) {
        where.push(`(pest_tags->'S') ?| $${paramIdx}`);
        params.push(arr);
        paramIdx++;
      }
    }
    if (pestT) {
      const arr = pestT.split(",").map((v) => v.trim()).filter((v) => v);
      if (arr.length > 0) {
        where.push(`(pest_tags->'T') ?| $${paramIdx}`);
        params.push(arr);
        paramIdx++;
      }
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
      SELECT id, title, url, source, created_at, summary, labels, thumbnail_url, published, pest_tags
      FROM articles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(sql, params);

    type Article = {
      id: number;
      title: string;
      url: string;
      source: string;
      created_at: string;
      summary: string;
      labels: string[];
      thumbnailUrl: string;
      published: string;
      pest_tags: {
        P: string[];
        E: string[];
        S: string[];
        T: string[];
      };
    };
    const articles: Article[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      source: row.source,
      created_at: row.created_at,
      summary: row.summary ?? "",
      labels: Array.isArray(row.labels)
        ? row.labels
        : (typeof row.labels === "string"
            ? JSON.parse(row.labels)
            : (row.labels ? row.labels : [])),
      thumbnailUrl: row.thumbnail_url || "https://placehold.co/340x180?text=No+Image",
      published: row.published ?? row.created_at ?? "",
      pest_tags: row.pest_tags
        ? (typeof row.pest_tags === "string"
            ? JSON.parse(row.pest_tags)
            : row.pest_tags)
        : { P: [], E: [], S: [], T: [] }
    }));
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
// /api/articles/:id エンドポイント（記事詳細取得）
app.get("/api/articles/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const result = await pool.query(
      "SELECT id, title, url, source, created_at, summary, labels, thumbnail_url, published FROM articles WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const row = result.rows[0];
    const article = {
      id: row.id,
      title: row.title,
      url: row.url,
      source: row.source,
      created_at: row.created_at,
      summary: row.summary ?? "",
      labels: Array.isArray(row.labels)
        ? row.labels
        : (typeof row.labels === "string"
            ? JSON.parse(row.labels)
            : (row.labels ? row.labels : [])),
      thumbnailUrl: row.thumbnail_url ?? "",
      published: row.published ?? ""
    };
    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
});

// /api/hello エンドポイント
app.get("/api/hello", (_req: Request, res: Response) => {
  res.send("Hello, World!");
});

// /api/admin/crawl エンドポイント
app.post("/api/admin/crawl", async (req: Request, res: Response) => {
  const { start_date, end_date, sources } = req.body;
  if (!start_date) {
    return res.status(400).json({ error: "start_date is required" });
  }
  try {
    const pipelineRes = await axios.post("http://pipeline:8000/crawl", null, {
      params: { start_date, end_date, sources }
    });
    res.json(pipelineRes.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * /api/admin/summarize エンドポイント
 * 要約・ラベル付けバッチ
 */
app.post("/api/admin/summarize", async (req: Request, res: Response) => {
  try {
    const pipelineRes = await axios.post("http://pipeline:8000/summarize", req.body);
    res.json(pipelineRes.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * /api/admin/pest_tag エンドポイント
 * 大カテゴリ・小カテゴリ分けバッチ
 */
app.post("/api/admin/pest_tag", async (req: Request, res: Response) => {
  try {
    const pipelineRes = await axios.post("http://pipeline:8000/pest_tag", req.body);
    res.json(pipelineRes.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * /api/crawl エンドポイント（admin不要版）
 * マイルストーン3互換
 */
app.post("/api/crawl", async (req: Request, res: Response) => {
  const { start_date, end_date, sources } = req.body;
  if (!start_date) {
    return res.status(400).json({ error: "start_date is required" });
  }
  try {
    const pipelineRes = await axios.post("http://pipeline:8000/crawl", null, {
      params: { start_date, end_date, sources }
    });
    res.json(pipelineRes.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/articles
 * 複数IDの記事を一括削除
 * リクエストボディ: { ids: number[] }
 */
app.delete("/api/articles", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid request: ids must be a non-empty array" });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const query = `DELETE FROM articles WHERE id IN (${placeholders})`;
    await pool.query(query, ids);
    res.status(204).send();
  } catch (err: any) {
    console.error("Error deleting articles:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * DELETE /api/articles/:id
 * 単一記事削除
 */
app.delete("/api/articles/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const result = await pool.query("DELETE FROM articles WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.status(204).send();
  } catch (err: any) {
    console.error("Error deleting article:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening at http://localhost:${port}`);
});

/**
 * /api/articles/:id/categorize
 * 記事内容をpipeline経由でLLMに投げてPESTカテゴリ自動付与
 */
app.post("/api/articles/:id/categorize", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    // 記事内容取得
    const result = await pool.query(
      "SELECT id, title, summary, labels FROM articles WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const article = result.rows[0];

    // pipelineにカテゴリ推論リクエスト
    const pipelineRes = await axios.post("http://pipeline:8000/categorize", {
      id: article.id,
      title: article.title,
      summary: article.summary,
      labels: article.labels,
    });

    // 推論結果（pest_tags）をDBに保存
    const pest_tags = pipelineRes.data.pest_tags;
    await pool.query(
      "UPDATE articles SET pest_tags = $1 WHERE id = $2",
      [JSON.stringify(pest_tags), id]
    );

    res.json({ id, pest_tags });
  } catch (err: any) {
    console.error("Error in categorize:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app;