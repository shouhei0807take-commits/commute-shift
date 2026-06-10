import { Hono } from 'hono';
import { pool } from '../db';

const app = new Hono();

/** GET /v1/stations/search?q=渋谷&limit=10 */
app.get('/search', async (c) => {
  const q = c.req.query('q') ?? '';
  const limit = Math.min(Number(c.req.query('limit') ?? 10), 30);

  if (q.length < 1) {
    return c.json({ stations: [] });
  }

  const result = await pool.query(
    `SELECT id, name, name_kana, prefecture
     FROM stations
     WHERE name ILIKE $1 OR name_kana ILIKE $1
     ORDER BY name
     LIMIT $2`,
    [`%${q}%`, limit]
  );

  return c.json({ stations: result.rows });
});

/** GET /v1/stations/:id */
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'Invalid id' }, 400);

  const result = await pool.query(
    `SELECT s.id, s.name, s.name_kana, s.prefecture,
            array_agg(DISTINCT l.name ORDER BY l.name) AS lines
     FROM stations s
     LEFT JOIN station_lines sl ON sl.station_id = s.id
     LEFT JOIN lines l ON l.id = sl.line_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [id]
  );

  if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json(result.rows[0]);
});

export default app;
