require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cache   = require('./cache');
const pool    = require('./db');
const startScheduler         = require('./scheduler');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter }         = require('./middleware/rateLimiter');

const VERSION = process.env.npm_package_version || '0.7.0';
const PORT    = process.env.PORT || 8000;

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: Origin ${origin} nicht erlaubt.`));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json());
app.use(apiLimiter);

// ── Health (inkl. DB-Ping) ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let dbStatus = 'ok';
  let dbLatencyMs = null;
  try {
    const t0 = Date.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - t0;
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }
  const status = dbStatus === 'ok' ? 'OK' : 'DEGRADED';
  res.status(dbStatus === 'ok' ? 200 : 503).json({
    status,
    version:     VERSION,
    timestamp:   new Date().toISOString(),
    db:          { status: dbStatus, latencyMs: dbLatencyMs },
    cache:       cache.stats(),
  });
});

// ── Routen ─────────────────────────────────────────────────────────────
app.use('/api/games',       require('./routes/games'));
app.use('/api/teams',       require('./routes/teams'));
app.use('/api/teamstats',   require('./routes/teamstats'));
app.use('/api/prediction',  require('./routes/prediction'));
app.use('/api/apifootball', require('./routes/apifootball'));
app.use('/api/broadcast',   require('./routes/broadcast').router);
app.use('/api/referee',     require('./routes/referee'));
app.use('/api/stats',       require('./routes/stats'));

// ── Globaler Error-Handler ──────────────────────────────────────────────
app.use(globalErrorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📊 StatNerds Backend v${VERSION} → http://localhost:${PORT}`);
  console.log(`🔒 CORS: ${allowedOrigins.join(', ')}`);
  startScheduler(cache);
});
