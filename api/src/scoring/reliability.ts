import { query } from "../db";

export async function fetchLineReliability(
  lineIds: number[]
): Promise<Map<number, number>> {
  if (!lineIds.length) return new Map();

  const { rows } = await query<{ line_id: number; reliability_score: number }>(
    `
    WITH snaps AS (
      SELECT line_id, status_code, severity
      FROM line_status_snapshots
      WHERE observed_at >= NOW() - INTERVAL '30 days'
        AND EXTRACT(ISODOW FROM observed_at) BETWEEN 1 AND 5
        AND EXTRACT(HOUR   FROM observed_at) BETWEEN 7 AND 9
        AND line_id = ANY($1::bigint[])
    ),
    agg AS (
      SELECT
        line_id,
        COUNT(*) AS total_cnt,
        SUM(CASE WHEN status_code IN ('delay','suspended') THEN 1 ELSE 0 END) AS problem_cnt,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) AS high_cnt
      FROM snaps
      GROUP BY line_id
    )
    SELECT
      line_id,
      CASE
        WHEN total_cnt = 0 THEN 70
        ELSE GREATEST(0, LEAST(100,
          100
          - (problem_cnt::float / total_cnt) * 60
          - (high_cnt::float   / total_cnt) * 20
        ))
      END AS reliability_score
    FROM agg
    `,
    [lineIds]
  );

  const map = new Map<number, number>();
  for (const r of rows) map.set(r.line_id, r.reliability_score);
  for (const id of lineIds) if (!map.has(id)) map.set(id, 75);
  return map;
}
