import "dotenv/config";
import express from "express";
import cors from "cors";
import { checkConnection } from "./db";
import stationsRouter from "./routes/stations";
import recommendRouter from "./routes/recommend";
import statusRouter from "./routes/status";
import congestionRouter from "./routes/congestion";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get("/health", async (_req, res) => {
  try {
    const { query } = await import("./db");
    await query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: "error", error: String(e) });
  }
});

app.use(stationsRouter);
app.use(recommendRouter);
app.use(statusRouter);
app.use(congestionRouter);

app.use((_req, res) => {
  res.status(404).json({
    meta: { timestamp: new Date().toISOString() },
    error: { code: "NOT_FOUND", message: "endpoint not found" },
  });
});

const PORT = Number(process.env.PORT ?? 8787);

async function main() {
  await checkConnection();
  app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error("[api] fatal error:", e);
  process.exit(1);
});
