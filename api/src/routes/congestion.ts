import { Hono } from 'hono';
import { pool } from '../db';

const app = new Hono();

/**
 * GET /v1/congestion/lines?lineIds=1,2,3
 * 指定路線の混雑状況を返す
 */
app.get('/lines', async (c) => {
  const raw = c.req.query('lineIds') ?? '';
  const lineIds = raw
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  if (lineIds.length === 0) {
    return c.json({ error: 'lineIds is required' }, 400);
  }

  const result = await pool.query(
    `WITH latest AS (
       SELECT
         line_id,
         congestion_rate,
         section_label,
         recorded_at,
         ROW_NUMBER() OVER (PARTITION BY line_id ORDER BY recorded_at DESC) AS rn
       FROM congestion_logs
       WHERE line_id = ANY($1)
     )
     SELECT
       l.id AS line_id,
       l.name AS line_name,
       COALESCE(cl.congestion_rate, 50) AS congestion_rate,
       cl.section_label,
       cl.recorded_at
     FROM lines l
     LEFT JOIN latest cl ON cl.line_id = l.id AND cl.rn = 1
     WHERE l.id = ANY($1)
     ORDER BY l.name`,
    [lineIds]
  );

  return c.json({ congestion: result.rows });
});

export default app;
