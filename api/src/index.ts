import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { Pool } from "pg";
import axios from "axios";
import { check, validationResult } from "express-validator";

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
  apis: ["./src/**/*.ts", "./src/topics.swagger.ts", "./dist/**/*.js"],
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

// TOPICS関連のインメモリストア（テスト/開発用バックアップ）
// 注: 本番環境ではデータベースを使用
const topicsStore: { 
  [id: string]: {
    id: string;
    title: string;
    articles: any[];
    categories: { [article_id: string]: { main: string; sub: string[] } };
    template_html?: string;
  } 
} = {};

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
 *   - name: Topics
 *     description: TOPICS配信関連API
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
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";
    
    // labelsパラメータの処理（配列または単一の値）
    let labels: string[] = [];
    if (req.query.labels) {
      if (Array.isArray(req.query.labels)) {
        labels = req.query.labels as string[];
      } else {
        labels = [req.query.labels as string];
      }
    }

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
    
    // ラベルによるフィルタリング
    if (labels.length > 0) {
      const labelConditions = labels.map((_, i) => {
        params.push(`%${labels[i]}%`);
        return `(labels::text ILIKE $${paramIdx++})`;
      });
      where.push(`(${labelConditions.join(" OR ")})`);
    } 
    
    // 日付フィルター
    if (startDate) {
      where.push(`published::date >= $${paramIdx}`);
      params.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      where.push(`published::date <= $${paramIdx}`);
      params.push(endDate);
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

    // デバッグ情報を出力
    console.log("SQL Query:", sql);
    console.log("SQL Params:", params);
    console.log("Where Conditions:", where);
    console.log("Request Query:", req.query);

    const result = await pool.query(sql, params);
    
    // レスポンスを正しい形式に整形
    const articles = result.rows.map((row: any) => ({
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
    
    // フロントエンドの期待するレスポンス形式
    res.json({
      items: articles,
      total: articles.length,
      page,
      limit
    });
  } catch (err: any) {
    console.error("Error fetching articles:", err);
    res.status(500).json({ error: err.message, items: [] }); // エラー時も items プロパティを含める
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
      "SELECT id, title, url, source, created_at, summary, labels, thumbnail_url, published, content FROM articles WHERE id = $1",
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
      published: row.published ?? "",
      content: row.content ?? ""
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
 * /api/articles/labels:
 *   get:
 *     tags: [Articles]
 *     summary: 全記事のラベル一覧を取得
 *     responses:
 *       200:
 *         description: 一意なラベル配列
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
app.get("/api/articles/labels", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT labels FROM articles");
    // labelsカラムは配列またはJSON文字列の可能性があるので両対応
    let allLabels: string[] = [];
    for (const row of result.rows) {
      let labels: string[] = [];
      if (Array.isArray(row.labels)) {
        labels = row.labels;
      } else if (typeof row.labels === "string") {
        try {
          labels = JSON.parse(row.labels);
        } catch {
          labels = [];
        }
      }
      if (Array.isArray(labels)) {
        allLabels.push(...labels);
      }
    }
    // 重複除去し、空文字やnullも除外
    const uniqueLabels = Array.from(new Set(allLabels)).filter(l => l && l.trim() !== "");
    res.json(uniqueLabels);
  } catch (err: any) {
    console.error("Error fetching article labels:", err);
    res.status(500).json({ error: err.message, items: [] });
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
app.post(
  "/api/summarize",
  [
    check("limit").isInt({ min: 1 }).withMessage("Limit must be a positive integer"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const pipelineRes = await axios.post("http://pipeline:8000/summarize", req.body);
      res.json(pipelineRes.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);


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

/**
 * @swagger
 * /api/topics:
 *   get:
 *     tags: [Topics]
 *     summary: TOPICS一覧取得（検索対応）
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: タイトル部分一致検索
 *     responses:
 *       200:
 *         description: TOPICSのリスト
 */
app.get("/api/topics", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    let sql = `SELECT id, title, month, created_at, updated_at, monthly_summary, template_html FROM topics`;
    let params: any[] = [];
    if (search && search.trim() !== "") {
      sql += ` WHERE title ILIKE $1`;
      params.push(`%${search}%`);
    }
    sql += ` ORDER BY created_at DESC`;
    console.log("[/api/topics] search param:", search);
    console.log("[/api/topics] SQL:", sql);
    console.log("[/api/topics] params:", params);
    const result = await pool.query(sql, params);
    console.log("[/api/topics] result count:", result.rows.length);
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error fetching topics:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/topics/search", async (req: Request, res: Response) => {
  const searchQuery = req.query.q;
  console.log("[/api/topics/search] req.query.q:", searchQuery);

  if (!searchQuery || typeof searchQuery !== 'string') {
    return res.status(400).json({ error: "検索キーワード 'q' が必要です。" });
  }

  try {
    const result = await pool.query(
      'SELECT id, title FROM topics WHERE title ILIKE $1 ORDER BY updated_at DESC LIMIT 10',
      [`%${searchQuery}%`]
    );
    console.log("[/api/topics/search] result.rows:", result.rows);
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error searching topics:", err);
    res.status(500).json({ error: err.message });
  }
});

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
 * @swagger
 * /api/topics:
 *   get:
 *     tags: [Topics]
 *     summary: TOPICS一覧取得
 *     responses:
 *       200:
 *         description: TOPICSのリスト
 */
app.get("/api/topics", async (req: Request, res: Response) => {
  try {
    // データベースからtopics一覧を取得
    const result = await pool.query(
      `SELECT id, title, month, created_at, updated_at, monthly_summary, template_html 
       FROM topics 
       ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error fetching topics:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/topics/{id}:
 *   get:
 *     tags: [Topics]
 *     summary: 特定のTOPICS取得
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *     responses:
 *       200:
 *         description: 指定したTOPICS
 *       404:
 *         description: TOPICSが見つからない
 */
app.get("/api/topics/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // トピックの基本情報を取得
    const topicResult = await pool.query(
      `SELECT id, title, month, created_at, updated_at, monthly_summary, template_html 
       FROM topics 
       WHERE id = $1`,
      [id]
    );
    
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "TOPICS not found" });
    }
    
    const topic = topicResult.rows[0];
    
    // トピックに関連する記事とカテゴリ情報を取得
    const articlesResult = await pool.query(
      `SELECT a.id, a.title, a.url, a.source, a.summary, a.labels, a.thumbnail_url, a.published,
              ta.display_order, ta.category_main, ta.category_sub
       FROM articles a
       JOIN topics_articles ta ON a.id = ta.article_id
       WHERE ta.topic_id = $1
       ORDER BY ta.display_order ASC`,
      [id]
    );
    
    // 記事情報を整形
    const articles = articlesResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      url: row.url,
      source: row.source,
      summary: row.summary || "",
      labels: row.labels || [],
      thumbnailUrl: row.thumbnail_url || "https://placehold.co/340x180?text=No+Image",
      published: row.published || row.created_at,
      displayOrder: row.display_order,
      categoryMain: row.category_main || "",
      categorySub: row.category_sub || []
    }));
    
    // カテゴリー情報を整形
    const categories: { [articleId: string]: { main: string; sub: string[] } } = {};
    articlesResult.rows.forEach(row => {
      if (row.category_main) {
        categories[row.id] = {
          main: row.category_main,
          sub: row.category_sub || []
        };
      }
    });
    
    // 完全なトピック情報をレスポンス
    const fullTopic = {
      ...topic,
      articles,
      categories
    };
    
    res.json(fullTopic);
  } catch (err: any) {
    console.error("Error fetching topic:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/topics:
 *   post:
 *     tags: [Topics]
 *     summary: 新規TOPICS作成
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
*           schema:
*             type: object
*             properties:
*               title:
*                 type: string
*               articles:
*                 type: array
*                 items: { type: object }
*               categories:
*                 type: object
*     responses:
*       200:
*         description: 作成成功
 */
app.post("/api/topics", async (req: Request, res: Response) => {
  const { title, articles, categories } = req.body;
  
  if (!title || !Array.isArray(articles) /* articles.length === 0 は許容する可能性も考慮 */) {
    return res.status(400).json({ status: "error", error: "タイトルと記事配列は必須です" });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const topicResult = await client.query(
      `INSERT INTO topics (title, month) 
       VALUES ($1, $2) 
       RETURNING id, title, month, created_at, updated_at`,
      [title, month]
    );
    
    const topicId = topicResult.rows[0].id;
    
    if (articles.length > 0) { // 記事がある場合のみ挿入処理
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        const category = categories && categories[article.article_id] 
          ? categories[article.article_id] 
          : { main: null, sub: [] };
        
        await client.query(
          `INSERT INTO topics_articles (topic_id, article_id, display_order, category_main, category_sub)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            topicId, 
            article.article_id, 
            article.display_order, // フロントエンドからの表示順を使用
            category.main,
            JSON.stringify(category.sub)
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ ...topicResult.rows[0], articles, categories, status: "ok" });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error("Error creating topic:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/topics/{id}:
 *   put:
 *     tags: [Topics]
 *     summary: TOPICS更新
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               articles:
 *                 type: array
 *                 items: { type: object }
 *               categories:
 *                 type: object
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: TOPICSが見つからない
 */
app.put("/api/topics/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, articles, categories } = req.body;
  
  if (!title || !Array.isArray(articles) /* articles.length === 0 は許容する可能性も考慮 */ ) {
    return res.status(400).json({ status: "error", error: "タイトルと記事配列は必須です" });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const topicCheck = await client.query('SELECT id FROM topics WHERE id = $1', [id]);
    if (topicCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: "error", error: "TOPICSが見つかりません" });
    }
    
    await client.query(
      'UPDATE topics SET title = $1 WHERE id = $2',
      [title, id]
    );
    
    await client.query('DELETE FROM topics_articles WHERE topic_id = $1', [id]);
    
    if (articles.length > 0) { // 記事がある場合のみ挿入処理
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        const category = categories && categories[article.article_id] 
          ? categories[article.article_id] 
          : { main: null, sub: [] };
        
        await client.query(
          `INSERT INTO topics_articles (topic_id, article_id, display_order, category_main, category_sub)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id, 
            article.article_id, 
            article.display_order, // フロントエンドからの表示順を使用
            category.main,
            JSON.stringify(category.sub)
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ id, title, articles, categories, status: "ok" });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error("Error updating topic:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/topics/{id}/article/{article_id}/category:
 *   patch:
 *     tags: [Topics]
 *     summary: 記事ごとのカテゴリ編集
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *       - in: path
 *         name: article_id
 *         required: true
 *         schema: { type: integer }
 *         description: 記事ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               main:
 *                 type: string
 *               sub:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: 編集成功
 *       404:
 *         description: TOPICSが見つからない
 */
app.patch("/api/topics/:id/article/:article_id/category", async (req: Request, res: Response) => {
  const { id, article_id } = req.params;
  const { main, sub } = req.body;
  
  if (!main) {
    return res.status(400).json({ status: "error", error: "mainカテゴリは必須です" });
  }
  
  try {
    // トピックと記事の関連が存在するか確認
    const checkResult = await pool.query(
      'SELECT 1 FROM topics_articles WHERE topic_id = $1 AND article_id = $2',
      [id, article_id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "TOPICS or article relationship not found" });
    }
    
    // カテゴリを更新
    await pool.query(
      `UPDATE topics_articles 
       SET category_main = $1, category_sub = $2
       WHERE topic_id = $3 AND article_id = $4`,
      [main, JSON.stringify(sub || []), id, article_id]
    );
    
    res.json({ status: "ok" });
  } catch (err: any) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/topics/{id}/article/{article_id}/categorize:
 *   post:
 *     tags: [Topics]
 *     summary: 記事カテゴリの自動分類
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *       - in: path
 *         name: article_id
 *         required: true
 *         schema: { type: integer }
 *         description: 記事ID
 *     responses:
 *       200:
 *         description: カテゴリ自動分類結果
 *       404:
 *         description: TOPICSが見つからない
 */
app.post("/api/topics/:id/article/:article_id/categorize", async (req: Request, res: Response) => {
  const { id, article_id } = req.params;
  
  try {
    // トピックと記事の関連が存在するか確認
    const checkResult = await pool.query(
      'SELECT 1 FROM topics_articles WHERE topic_id = $1 AND article_id = $2',
      [id, article_id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "TOPICS or article relationship not found" });
    }
    
    // 記事情報を取得
    const articleResult = await pool.query(
      'SELECT title, summary FROM articles WHERE id = $1',
      [article_id]
    );
    
    if (articleResult.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "Article not found" });
    }
    
    // 将来的にはpipelineサービスと連携してAI分類を実装
    // ダミー実装: 技術/新製品に分類
    const category = { main: "技術", sub: ["新製品"] };
    
    // カテゴリを更新
    await pool.query(
      `UPDATE topics_articles 
       SET category_main = $1, category_sub = $2
       WHERE topic_id = $3 AND article_id = $4`,
      [category.main, JSON.stringify(category.sub), id, article_id]
    );
    
    res.json({ category });
  } catch (err: any) {
    console.error("Error categorizing article:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/topics/{id}/categorize:
 *   post:
 *     tags: [Topics]
 *     summary: 複数記事のLLM自動分類
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               article_ids:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200:
 *         description: カテゴリ分類結果
 *       404:
 *         description: TOPICSが見つからない
 */
app.post("/api/topics/:id/categorize", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { article_ids } = req.body;
  
  if (!Array.isArray(article_ids) || article_ids.length === 0) {
    return res.status(400).json({ status: "error", error: "article_idsは必須です" });
  }
  
  try {
    // トピックが存在するか確認
    const topicCheck = await pool.query(
      'SELECT id FROM topics WHERE id = $1',
      [id]
    );
    
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "TOPICS not found" });
    }
    
    // カテゴリ情報を格納するオブジェクトの型定義
    interface CategoryInfo {
      main: string;
      sub: string[];
    }
    const categories: Record<number, CategoryInfo> = {};
    
    // 各記事に対してカテゴリを設定
    for (const articleId of article_ids) {
      // ダミー: すべて技術/新製品
      const category: CategoryInfo = { main: "技術", sub: ["新製品"] };
      categories[articleId] = category;
      
      // トピックと記事の関連を更新
      await pool.query(
        `UPDATE topics_articles 
         SET category_main = $1, category_sub = $2
         WHERE topic_id = $3 AND article_id = $4`,
        [category.main, JSON.stringify(category.sub), id, articleId]
      );
    }
    
    res.json({ categories });
  } catch (err: any) {
    console.error("Error categorizing articles:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/topics/{id}/export:
 *   post:
 *     tags: [Topics]
 *     summary: 配信テンプレートHTML出力
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *     responses:
 *       200:
 *         description: 生成されたHTML
 *       404:
 *         description: TOPICSが見つからない
 */
app.post("/api/topics/:id/export", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // トピック情報を取得
    const topicResult = await pool.query(
      'SELECT title FROM topics WHERE id = $1',
      [id]
    );
    
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "TOPICS not found" });
    }
    
    const topic = topicResult.rows[0];
    
    // トピックに関連する記事とカテゴリ情報を取得
    const articlesResult = await pool.query(
      `SELECT a.id, a.title, a.url, a.source, a.summary, a.published,
              ta.category_main, ta.category_sub
       FROM articles a
       JOIN topics_articles ta ON a.id = ta.article_id
       WHERE ta.topic_id = $1
       ORDER BY ta.display_order ASC`,
      [id]
    );
    
    // HTML生成
    let html = `<html><body><h1>${topic.title}</h1>`;
    
    // グループ化のための型定義
    interface ArticleWithCategory {
      id: number;
      title: string;
      url: string;
      source: string;
      summary?: string;
      published?: string;
      category_main?: string;
      category_sub?: string[];
    }
    
    // 記事をカテゴリごとにグループ化
    const grouped: Record<string, ArticleWithCategory[]> = {};
    
    articlesResult.rows.forEach(article => {
      const categoryMain = article.category_main || "未分類";
      if (!grouped[categoryMain]) {
        grouped[categoryMain] = [];
      }
      grouped[categoryMain].push(article);
    });
    
    // カテゴリごとに記事を表示
    Object.keys(grouped).forEach(categoryMain => {
      html += `<h2>${categoryMain}</h2><ul>`;
      grouped[categoryMain].forEach(article => {
        html += `<li>${article.title}</li>`;
      });
      html += "</ul>";
    });
    
    html += "</body></html>";
    
    // テンプレートHTMLを保存
    await pool.query(
      'UPDATE topics SET template_html = $1 WHERE id = $2',
      [html, id]
    );
    
    res.json({ html });
  } catch (err: any) {
    console.error("Error exporting template:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/topics/{id}/summary:
 *   post:
 *     tags: [Topics]
 *     summary: 月次まとめ自動生成
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *     responses:
 *       200:
 *         description: 月次まとめ生成結果
 *       500:
 *         description: エラー
 */
app.post("/api/topics/:id/summary", async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // トピックが存在するか確認
    const topicCheck = await pool.query('SELECT id FROM topics WHERE id = $1', [id]);
    
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ status: "error", error: "TOPICS not found" });
    }
    
    // トピックに関連する記事を取得
    const articlesResult = await pool.query(
      `SELECT a.id, a.title, a.url, a.source, a.summary
       FROM articles a
       JOIN topics_articles ta ON a.id = ta.article_id
       WHERE ta.topic_id = $1`,
      [id]
    );
    
    const articles = articlesResult.rows;
    
    try {
      // パイプラインサービスを呼び出し
      const pipelineRes = await axios.post(
        `http://pipeline:8000/topics/${id}/summary`,
        { articles }
      );
      
      const { monthly_summary } = pipelineRes.data;
      
      // 月次まとめを保存
      await pool.query(
        'UPDATE topics SET monthly_summary = $1 WHERE id = $2',
        [monthly_summary, id]
      );
      
      res.json({ monthly_summary });
    } catch (pipelineErr: any) {
      console.warn("Pipeline service not available. Using dummy implementation.");
      
      // ダミー実装
      const monthly_summary = "これは自動生成された月次まとめです。実際の実装では、LLMを使用して記事の内容から要約が生成されます。";
      
      // 月次まとめを保存
      await pool.query(
        'UPDATE topics SET monthly_summary = $1 WHERE id = $2',
        [monthly_summary, id]
      );
      
      res.json({ monthly_summary });
    }
  } catch (err: any) {
    console.error("Error generating monthly summary:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ─────────────────────────────

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});

export default app;