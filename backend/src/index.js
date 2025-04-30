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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;