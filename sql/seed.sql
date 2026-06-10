-- commute-shift seed data
-- MVP: JR東日本 / 東京メトロ / 都営交通 主要路線

-- 路線
INSERT INTO lines (id, name, name_en, operator, color_hex) VALUES
  (1,  '山手線',           'Yamanote Line',       'JR東日本', '#9ACD32'),
  (2,  '中央線',           'Chuo Line',           'JR東日本', '#F15A22'),
  (3,  '京浜東北線',       'Keihin-Tohoku Line',  'JR東日本', '#00B2E5'),
  (4,  '浜松道線',         'Shonan-Shinjuku Line','JR東日本', '#F68B1F'),
  (5,  '銀座線',           'Ginza Line',          '東京メトロ', '#F39800'),
  (6,  '丸ノ内線',         'Marunouchi Line',    '東京メトロ', '#EF454A'),
  (7,  '日比谷線',         'Hibiya Line',         '東京メトロ', '#B5B5AC'),
  (8,  '東西線',           'Tozai Line',          '東京メトロ', '#00A7D8'),
  (9,  '千代田線',         'Chiyoda Line',       '東京メトロ', '#00BB85'),
  (10, '有楽町線',         'Yurakucho Line',     '東京メトロ', '#C9A000'),
  (11, '半蔵・副都心線', 'Hanzomon Line',      '東京メトロ', '#8F76D6'),
  (12, '南北線',           'Namboku Line',        '東京メトロ', '#00AC9B'),
  (13, '副都心線',         'Fukutoshin Line',    '東京メトロ', '#9C5E31'),
  (14, '大江戸線',         'Oedo Line',          '都営交通', '#E85298'),
  (15, '浅草線',           'Asakusa Line',        '都営交通', '#EE3333'),
  (16, '三田線',           'Mita Line',           '都営交通', '#0079C2'),
  (17, '新宿線',           'Shinjuku Line',       '都営交通', '#6CBB3C')
ON CONFLICT (id) DO NOTHING;

-- 主要駅
INSERT INTO stations (id, name, name_kana, prefecture) VALUES
  (1,  '東京',     'とうきょう',   '東京都'),
  (2,  '渋谷',     'しぶや',     '東京都'),
  (3,  '新宿',     'しんじゅく', '東京都'),
  (4,  '池袋',     'いけぶくろ', '東京都'),
  (5,  '上野',     'うえの',     '東京都'),
  (6,  '秋葉原',   'あきはばら', '東京都'),
  (7,  '大手町',   'おおてまち', '東京都'),
  (8,  '品川',     'しながわ', '東京都'),
  (9,  '目黒',     'めぐろ',     '東京都'),
  (10, '恵比寿',   'えびす',   '東京都'),
  (11, '三田',     'みた',       '東京都'),
  (12, '永田町',   'ながたちょう', '東京都'),
  (13, '山手',     'やまのて', '東京都'),
  (14, '高田馬場', 'たかだのばば', '東京都'),
  (15, '中野',     'なかの',     '東京都')
ON CONFLICT (id) DO NOTHING;

-- 駅-路線 連携
INSERT INTO station_lines (station_id, line_id) VALUES
  (1, 1),(1, 2),(1, 3),  -- 東京: 山手線/中央線/京浜東北線
  (2, 1),(2, 5),(2, 11), -- 渋谷: 山手線/銀座線/半蔵
  (3, 1),(3, 6),(3, 14), -- 新宿: 山手線/丸ノ内線/大江戸線
  (4, 1),(4, 6),(4, 9),  -- 池袋: 山手線/丸ノ内線/千代田線
  (5, 1),(5, 5),(5, 7),  -- 上野: 山手線/銀座線/日比谷線
  (6, 1),(6, 3),         -- 秋葉原: 山手線/京浜東北線
  (7, 1),(7, 12),        -- 大手町: 山手線/南北線
  (8, 1),(8, 3),         -- 品川: 山手線/京浜東北線
  (9, 1),(9, 7),         -- 目黒: 山手線/日比谷線
  (10, 1),(10, 5),       -- 恵比寿: 山手線/銀座線
  (11, 12),(11, 16),     -- 三田: 南北線/三田線
  (12, 2),(12, 10),      -- 永田町: 中央線/有楽町線
  (14, 2),(14, 17)       -- 高田馬場: 中央線/新宿線
ON CONFLICT DO NOTHING;

-- 選折路索サンプル (渋谷→東京)
INSERT INTO routes (id, name, from_station_id, to_station_id, transfer_count, estimated_minutes) VALUES
  (1, '山手線 直通',         2, 1, 0, 30),
  (2, '渋谷→中野→東京', 2, 1, 1, 45),
  (3, '銀座線ルート',       2, 1, 1, 35)
ON CONFLICT (id) DO NOTHING;

INSERT INTO route_lines (route_id, line_id, seq) VALUES
  (1, 1, 0),         -- 路索1: 山手線のみ
  (2, 11, 0),(2, 2, 1), -- 路索2: 半蔵→中央線
  (3, 5, 0),(3, 6, 1)   -- 路索3: 銀座線→丸ノ内線
ON CONFLICT DO NOTHING;

-- 初期運行情報 (normal)
INSERT INTO snaps (line_id, status_code, severity, description, source)
SELECT id, 'normal', 'none', '通常運行', 'seed'
FROM lines;

-- 初期混雑データ
INSERT INTO congestion_logs (line_id, congestion_rate, section_label, source) VALUES
  (1,  180, '渋谷→新宿',   'seed'),
  (2,  200, '中野→新宿',   'seed'),
  (3,  160, '浜松町→東京', 'seed'),
  (5,   90, '渋谷→表参道', 'seed'),
  (6,  150, '新宿→四谷',   'seed'),
  (14, 170, '新宿→夜区',   'seed');
