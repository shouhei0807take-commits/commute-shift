import { Hono } from 'hono';
import { pool } from '../db';

const app = new Hono();

/**
 * GET /v1/status/lines
 * 全路線の運行情報一覧を返す
 * 将来的にはODPT APIと差替えする
 */
app.get('/lines', async (c) => {
  const result = await pool.query(
    `SELECT
       l.id AS line_id,
       l.name AS line_name,
       l.operator,
       COALESCE(
         (
           SELECT s.status_code
           FROM snaps s
           WHERE s.line_id = l.id
           ORDER BY s.observed_at DESC
           LIMIT 1
         ),
         'normal'
       ) AS status_code,
       COALESCE(
         (
           SELECT s.description
           FROM snaps s
           WHERE s.line_id = l.id
           ORDER BY s.observed_at DESC
           LIMIT 1
         ),
         '情報なし'
       ) AS description
     FROM lines l
     ORDER BY l.operator, l.name`
  );

  return c.json({ lines: result.rows });
});

/**
 * GET /v1/status/lines/:lineId
 * 特定路線の運行情報を返す
 */
app.get('/lines/:lineId', async (c) => {
  const lineId = Number(c.req.param('lineId'));
  if (isNaN(lineId)) return c.json({ error: 'Invalid lineId' }, 400);

  const result = await pool.query(
    `SELECT
       l.id AS line_id,
       l.name AS line_name,
       l.operator,
       s.status_code,
       s.severity,
       s.description,
       s.observed_at
     FROM lines l
     LEFT JOIN LATERAL (
       SELECT status_code, severity, description, observed_at
       FROM snaps
       WHERE line_id = $1
       ORDER BY observed_at DESC
       LIMIT 1
     ) s ON true
     WHERE l.id = $1`,
    [lineId]
  );

  if (result.rows.length === 0) return c.json({ error: 'Not found' }, 404);
  return c.json(result.rows[0]);
});

export default app;
