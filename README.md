# CommuteShift 🚆

**満員電車を回遺して快適通勤**

CommuteShiftは、首都圏（東京・神奈川・埼玉・千葉）の通勤者向けに、混雑回遺と運行情報を組み合わせた最適経路を提案するWebアプリです。

## 🎯 プロジェクト概要

### 目的
- JR東日本・東京メトロ・都営交通を中心に、混雑度と運行情報を考慮した通勤経路を推奨
- 全体最適化（単一路線ではなく、複数路線を跨いだベストバランス）でストレス軽減
- ODPT (Open Data for Public Transportation) と Jorudan Biz API の段階的統合を前提

### 機能特徴
- **混雑回遺スコアリング**: 各路線の混雑率と運行情報を得点化し、上位3候補を提示
- **複数路線対応**: 直通・乗り換えルートを横断比較
- **リアルタイム情報**: DBに記録された最新スナップショットを参照（未来的にODPT差替え）

---

## 📊 アーキテクチャ

```
[Frontend (web/)]  <-->  [API (api/)]  <-->  [PostgreSQL (sql/)]
                          ||
                     (scoring/ ロジック)
```

- **Frontend**: HTML + Vanilla JS (簡易UI、将来的にReact等へ移行可)
- **API**: Hono (TypeScript) on Node.js + PostgreSQL
- **DB**: PostgreSQL 15+ with schema & seed
- **Docker Compose**: 3サービス（db, api, web）

---

## 🚀 クイックスタート

### 1. リポジトリクローン
```bash
git clone https://github.com/shouhei0807take-commits/commute-shift.git
cd commute-shift
```

### 2. 環境変数設定
```bash
cp .env.example .env
# .env を編集して DB_PASSWORD などを設定
```

### 3. Docker Compose で起動
```bash
docker compose up --build
```

- **API**: http://localhost:3000
- **Web**: http://localhost:8080
- **DB**: localhost:5432 (PostgreSQL)

### 4. DB初期化
```bash
# schema + seed 投入
docker compose exec db psql -U commuteuser -d commute_db -f /docker-entrypoint-initdb.d/schema.sql
docker compose exec db psql -U commuteuser -d commute_db -f /docker-entrypoint-initdb.d/seed.sql
```

---

## 📁 プロジェクト構成

```
commute-shift/
├─ api/
│   ├─ Dockerfile
│   ├─ package.json
│   ├─ tsconfig.json
│   └─ src/
│       ├─ index.ts          # エントリーポイント
│       ├─ db.ts             # PostgreSQL接続
│       ├─ routes/
│       │   ├─ recommend.ts   # /v1/recommendations/commute
│       │   ├─ stations.ts    # /v1/stations/*
│       │   ├─ status.ts      # /v1/status/lines
│       │   └─ congestion.ts  # /v1/congestion/lines
│       └─ scoring/
│           ├─ reliability.ts # 運行情報スコア
│           ├─ congestion.ts  # 混雑スコア
│           └─ score.ts       # 統合スコア算出
├─ sql/
│   ├─ schema.sql         # DDL (lines, stations, routes, etc.)
│   └─ seed.sql           # 初期データ (JR/メトロ/都営主要路線)
├─ web/
│   └─ index.html         # 簡易フロント
├─ docker-compose.yml
├─ .env.example
├─ .gitignore
└─ README.md
```

---

## 📡 APIエンドポイント

### **GET** `/v1/recommendations/commute`
混雑・運行情報を考慮した推奨路線と3件返却。

**パラメータ**:
- `fromStationId` (number): 出発駅ID
- `toStationId` (number): 到着駅ID
- `preference` (string): `comfort` | `speed` | `balanced` (デフォルト: `balanced`)

**レスポンス例**:
```json
{
  "recommendations": [
    {
      "routeId": 1,
      "routeName": "山手線 直通",
      "lines": [{"lineId": 1, "lineName": "山手線"}],
      "transferCount": 0,
      "estimatedMinutes": 30,
      "score": {
        "total": 85.5,
        "reliability": 90,
        "congestion": 70,
        "breakdown": {
          "reliabilityScore": 45,
          "congestionScore": 40.5
        }
      }
    }
  ]
}
```

---

## 🛠️ 開発ロードマップ

### Phase 1: MVP (現在)
- [x] Docker Compose 構成
- [x] DBスキーマ + seed
- [x] API基本実装 (Hono + TypeScript)
- [x] スコアリングロジック
- [x] 簡易フロント (HTML + JS)

### Phase 2: 外部API連携
- [ ] ODPT API統合（運行情報・stationマスタ）
- [ ] Jorudan Biz API統合（経路検索）
- [ ] 駅名検索オートコンプリートUI
- [ ] 駅IDの保持とバリデーション

### Phase 3: UI/UX改善
- [ ] React/Vue.js移行
- [ ] 3候補カード表示の最適化
- [ ] モバイル対応強化
- [ ] リアルタイムダッシュボード

---

## 👥 コントリビューター

Pull Requestを歓迎します！以下の流れでお願いします：

1. Fork & Clone
2. ブランチ作成: `git checkout -b feature/your-feature`
3. コミット: `git commit -m 'Add some feature'`
4. Push: `git push origin feature/your-feature`
5. Pull Request作成

---

## 📝 ライセンス

MIT License

---

## 📧 お問い合わせ

IssueもしくはPull Requestでお問い合わせください。
