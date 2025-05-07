import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/api/articles', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, url, source, created_at FROM articles ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 手動記事追加APIエンドポイント
app.post('/api/articles', async (req, res) => {
  try {
    const { title, url, published, source } = req.body;
    
    // バリデーション
    if (!title || !url) {
      return res.status(400).json({ error: 'タイトルとURLは必須です' });
    }

    // URLの重複チェック
    const existingCheck = await pool.query('SELECT id FROM articles WHERE url = $1', [url]);
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: '同じURLの記事が既に存在します' });
    }

    const publishedDate = published ? new Date(published) : new Date();
    
    const result = await pool.query(
      'INSERT INTO articles (title, url, source, published, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [title, url, source || '手動追加', publishedDate]
    );
    
    res.status(201).json({ 
      id: result.rows[0].id,
      message: '記事が追加されました' 
    });
  } catch (err) {
    console.error('Error adding article:', err);
    res.status(500).json({ error: '記事の追加中にエラーが発生しました' });
  }
});

app.delete('/api/articles', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid request: ids must be a non-empty array' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const query = `DELETE FROM articles WHERE id IN (${placeholders})`;
    await pool.query(query, ids);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting articles:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ジョブ管理APIのエンドポイントを追加
app.post('/api/jobs/start', async (req, res) => {
    const { type } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO jobs (type, status) VALUES ($1, $2) RETURNING id',
            [type, 'pending']
        );
        res.json({ jobId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to start job' });
    }
});

app.get('/api/jobs/:jobId/status', async (req, res) => {
    const { jobId } = req.params;
    try {
        const result = await db.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch job status' });
    }
});

app.delete('/api/jobs/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        const result = await db.query(
            'UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *',
            ['failure', jobId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to stop job' });
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;