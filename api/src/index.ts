import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import axios from "axios";

import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";


const app = express();
const port = 4000;


// ─── Middleware ──────────────────────────────
app.use(cors());
app.use(express.json());



// ─── Swagger Setup ───────────────────────────
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Semicon API", version: "1.0.0" },
  },
  apis: ["./src/**/*.ts", "./dist/**/*.js"],
});

app.use(
  "/api-docs",
  ...(process.env.NODE_ENV !== "production"
    ? [
        (req: Request, _res: Response, next: NextFunction) => {
          console.log(`[Swagger] ${req.method} ${req.originalUrl}`);
          next();
        },
      ]
    : []),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

console.log(`[Swagger] API docs available at http://localhost:${port}/api-docs`);



// ─── DB Pool ─────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});



// ─── Routes ───────────────────────────────────

/**
 * @swagger
 * tags:
 *   - name: System
 *     description: システム確認・稼働状態
 *   - name: Articles
 *     description: 記事取得・削除API
 *   - name: Batch
 *     description: 要約・収集のバッチAPI
 */


/**
* @swagger
* /api/health:
*   get:
*     tags: [System]
*     summary: ヘルスチェック
*     responses:
*       200:
*         description: ヘルスチェック成功
*/

app.get("/api/health", (_req: Request, res: Response) => {
  res.send("OK");
});


/**
* @swagger
* /api/articles:
*   get:
*     tags: [Articles]
*     summary: 記事一覧を取得
*     parameters:
*       - in: query
*         name: page
*         schema: { type: integer }
*         description: ページ番号
*       - in: query
*         name: limit
*         schema: { type: integer }
*         description: 1ページあたりの件数
*       - in: query
*         name: keyword
*         schema: { type: string }
*         description: 検索キーワード
*     responses:
*       200:
*         description: 記事リスト
*/

app.get("/api/articles", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 0;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = page * limit;

    const keyword = (req.query.keyword as string) || "";
    const source = (req.query.source as string) || "";
    const tag = (req.query.tag as string) || "";
    const dateFrom = (req.query.date_from as string) || "";
    const dateTo = (req.query.date_to as string) || "";

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

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
      SELECT id, title, url, source, created_at, summary, labels, thumbnail_url, published
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
      published: row.published ?? row.created_at ?? ""
    }));
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/**
* @swagger
* /api/articles/{id}:
*   get:
*     tags: [Articles]
*     summary: 単一記事を取得
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema: { type: integer }
*         description: 記事ID
*     responses:
*       200:
*         description: 記事オブジェクト
*       404:
*         description: 記事が見つからない
*/

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


/**
* @swagger
* /api/articles/{id}:
*   delete:
*     tags: [Articles]
*     summary: 単一記事削除
*     parameters:
*       - in: path
*         name: id
*         required: true
*         schema: { type: integer }
*         description: 記事ID
*     responses:
*       204:
*         description: 削除成功
*       404:
*         description: 記事が見つからない
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


/**
* @swagger
* /api/articles:
*   delete:
*     tags: [Articles]
*     summary: 複数IDの記事を一括削除
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               ids:
*                 type: array
*                 items: { type: integer }
*                 description: 削除対象記事IDリスト
*     responses:
*       204:
*         description: 削除成功
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
* @swagger
* /api/summarize:
*   post:
*     tags: [Batch]
*     summary: 記事要約・ラベル付けバッチ
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               limit:
*                 type: integer
*                 description: 要約対象記事数
*     responses:
*       200:
*         description: バッチ実行結果
*/
app.post("/api/summarize", async (req: Request, res: Response) => {
  try {
    const pipelineRes = await axios.post("http://pipeline:8000/summarize", req.body);
    res.json(pipelineRes.data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/**
* @swagger
* /api/crawl:
*   post:
*     tags: [Batch]
*     summary: 記事収集バッチ
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               start_date:
*                 type: string
*                 format: date
*                 description: 収集開始日
*               end_date:
*                 type: string
*                 format: date
*                 description: 収集終了日
*               sources:
*                 type: array
*                 items: { type: string }
*                 description: 収集対象ソース
*     responses:
*       200:
*         description: バッチ実行結果
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


// ─── Start Server ─────────────────────────────

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});

export default app;