import { pool } from '../db';

/**
 * 混雑スコアをDBから取得して返す
 * congestion_logs テーブルの直近データを集計
 * スコア: 0(空いている) ~ 100(超混雑)
 */
export async function getCongestionScores(
  lineIds: number[]
): Promise<Map<number, number>> {
  if (lineIds.length === 0) return new Map();

  const result = await pool.query<{ line_id: number; congestion_score: number }>(
    `
    WITH latest AS (
      SELECT
        line_id,
        congestion_rate,
        ROW_NUMBER() OVER (PARTITION BY line_id ORDER BY recorded_at DESC) AS rn
      FROM congestion_logs
      WHERE line_id = ANY($1)
    )
    SELECT
      line_id,
      GREATEST(0, LEAST(100, ROUND(congestion_rate::numeric))) AS congestion_score
    FROM latest
    WHERE rn = 1
    `,
    [lineIds]
  );

  const map = new Map<number, number>();
  for (const row of result.rows) {
    map.set(Number(row.line_id), Number(row.congestion_score));
  }
  // DBにデータがない路線はデフォルト50
  for (const id of lineIds) {
    if (!map.has(id)) map.set(id, 50);
  }
  return map;
}
