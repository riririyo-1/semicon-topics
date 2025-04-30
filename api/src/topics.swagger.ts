/**
 * @swagger
 * /api/topics:
 *   post:
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

/**
 * @swagger
 * /api/topics/{id}/article/{article_id}/category:
 *   patch:
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
 */

/**
 * @swagger
 * /api/topics/{id}/categorize:
 *   post:
 *     summary: LLM自動分類
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
 */

/**
 * @swagger
 * /api/topics/{id}/export:
 *   post:
 *     summary: 配信テンプレートHTML出力
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TOPICS ID
 *     responses:
 *       200:
 *         description: テンプレートHTML
 */