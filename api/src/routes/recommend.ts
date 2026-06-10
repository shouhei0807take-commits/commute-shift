import { Hono } from 'hono';
import { pool } from '../db';
import { getReliabilityScores } from '../scoring/reliability';
import { getCongestionScores } from '../scoring/congestion';
import { calcTotalScore } from '../scoring/score';

const app = new Hono();

interface RouteCandidate {
  routeId: number;
  routeName: string;
  lines: { lineId: number; lineName: string }[];
  transferCount: number;
  estimatedMinutes: number;
}

/**
 * GET /v1/recommendations/commute
 * ?fromStationId=1&toStationId=2&preference=balanced
 *
 * 候補路線を最大10件取得し、スコアを計算して上余3件を返す
 */
app.get('/commute', async (c) => {
  const fromStationId = Number(c.req.query('fromStationId'));
  const toStationId = Number(c.req.query('toStationId'));
  const preference = (c.req.query('preference') ?? 'balanced') as
    | 'comfort'
    | 'speed'
    | 'balanced';

  if (isNaN(fromStationId) || isNaN(toStationId)) {
    return c.json({ error: 'fromStationId and toStationId are required' }, 400);
  }

  // 候補路索をDBから取得
  const routeResult = await pool.query<{
    route_id: number;
    route_name: string;
    line_ids: number[];
    line_names: string[];
    transfer_count: number;
    estimated_minutes: number;
  }>(
    `SELECT
       r.id AS route_id,
       r.name AS route_name,
       array_agg(rl.line_id ORDER BY rl.seq) AS line_ids,
       array_agg(l.name ORDER BY rl.seq) AS line_names,
       r.transfer_count,
       r.estimated_minutes
     FROM routes r
     JOIN route_lines rl ON rl.route_id = r.id
     JOIN lines l ON l.id = rl.line_id
     WHERE r.from_station_id = $1
       AND r.to_station_id = $2
       AND r.is_active = true
     GROUP BY r.id, r.name, r.transfer_count, r.estimated_minutes
     ORDER BY r.estimated_minutes
     LIMIT 10`,
    [fromStationId, toStationId]
  );

  if (routeResult.rows.length === 0) {
    return c.json({ recommendations: [] });
  }

  // 全路線のlineIdsを収集
  const allLineIds = [
    ...new Set(routeResult.rows.flatMap((r) => r.line_ids)),
  ];

  // 並列でスコア取得
  const [reliabilityMap, congestionMap] = await Promise.all([
    getReliabilityScores(allLineIds),
    getCongestionScores(allLineIds),
  ]);

  // 候補ごとにスコア計算
  const recommendations = routeResult.rows
    .map((row) => {
      const lineScores = row.line_ids.map((id) => ({
        reliability: reliabilityMap.get(id) ?? 70,
        congestion: congestionMap.get(id) ?? 50,
      }));
      // 路線内の最悪値を使用（ボトルネック考慮）
      const reliability = Math.min(...lineScores.map((s) => s.reliability));
      const congestion = Math.max(...lineScores.map((s) => s.congestion));

      const { totalScore, breakdown } = calcTotalScore(
        { reliability, congestion },
        preference
      );

      return {
        routeId: row.route_id,
        routeName: row.route_name,
        lines: row.line_ids.map((id, i) => ({
          lineId: id,
          lineName: row.line_names[i],
        })),
        transferCount: row.transfer_count,
        estimatedMinutes: row.estimated_minutes,
        score: {
          total: totalScore,
          reliability,
          congestion,
          breakdown,
        },
      };
    })
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 3);

  return c.json({ recommendations });
});

export default app;
