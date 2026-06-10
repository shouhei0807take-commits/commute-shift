-- commute-shift schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 路線テーブル
CREATE TABLE IF NOT EXISTS lines (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  name_en     TEXT,
  operator    TEXT NOT NULL, -- 'JR東日本' | '東京メトロ' | '都営交通' | 'その他'
  color_hex   TEXT,          -- UI表示用
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 駅テーブル
CREATE TABLE IF NOT EXISTS stations (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  name_kana   TEXT,
  prefecture  TEXT NOT NULL DEFAULT '東京都',
  lat         NUMERIC(9,6),
  lon         NUMERIC(9,6),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 駅-路線 中間テーブル
CREATE TABLE IF NOT EXISTS station_lines (
  station_id  INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  line_id     INT NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
  PRIMARY KEY (station_id, line_id)
);

-- 運行情報スナップ
CREATE TABLE IF NOT EXISTS snaps (
  id          BIGSERIAL PRIMARY KEY,
  line_id     INT NOT NULL REFERENCES lines(id),
  status_code TEXT NOT NULL DEFAULT 'normal', -- 'normal' | 'delay' | 'suspended' | 'partial'
  severity    TEXT NOT NULL DEFAULT 'none',   -- 'none' | 'low' | 'medium' | 'high'
  description TEXT,
  source      TEXT DEFAULT 'manual',          -- 'odpt' | 'manual'
  observed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snaps_line_observed ON snaps(line_id, observed_at DESC);

-- 混雑ログ
CREATE TABLE IF NOT EXISTS congestion_logs (
  id              BIGSERIAL PRIMARY KEY,
  line_id         INT NOT NULL REFERENCES lines(id),
  section_label   TEXT,               -- 例: '武蔵野→渋谷'
  congestion_rate NUMERIC(5,2),       -- 0～200+%表記（100％=満席）
  source          TEXT DEFAULT 'manual',
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_congestion_line_recorded ON congestion_logs(line_id, recorded_at DESC);

-- 推奨路索
CREATE TABLE IF NOT EXISTS routes (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  from_station_id  INT NOT NULL REFERENCES stations(id),
  to_station_id    INT NOT NULL REFERENCES stations(id),
  transfer_count   INT NOT NULL DEFAULT 0,
  estimated_minutes INT NOT NULL DEFAULT 30,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_from_to ON routes(from_station_id, to_station_id);

-- 路索構成路線
CREATE TABLE IF NOT EXISTS route_lines (
  route_id  INT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  line_id   INT NOT NULL REFERENCES lines(id),
  seq       INT NOT NULL DEFAULT 0,  -- 乗り流れ順
  PRIMARY KEY (route_id, seq)
);
