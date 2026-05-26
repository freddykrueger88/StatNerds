require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cache   = require('./cache');
const startScheduler       = require('./scheduler');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter, cleanupLimiter } = require('./middleware/rateLimiter');
const { requireApiKey }    = require('./middleware/requireApiKey');

const VERSION = '0.6.0';
const PORT    = process.env.PORT || 8000;

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
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

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'OK',
    version:   VERSION,
    timestamp: new Date().toISOString(),
    cache:     cache.stats(),
  });
});

// ── Routen ──────────────────────────────────────────────────────────────────
app.use('/api/games',       require('./routes/games'));
app.use('/api/teams',       require('./routes/teams'));
app.use('/api/teamstats',   require('./routes/teamstats'));
app.use('/api/prediction',  require('./routes/prediction'));
app.use('/api/apifootball', require('./routes/apifootball'));
app.use('/api/broadcast',   require('./routes/broadcast').router);
app.use('/api/referee',     require('./routes/referee'));
app.use('/api/stats',       require('./routes/stats'));

// ── Globaler Error-Handler ──────────────────────────────────────────────────
app.use(globalErrorHandler);

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📊 StatNerds Backend v${VERSION} → http://localhost:${PORT}`);
  console.log(`🔒 CORS: ${allowedOrigins.join(', ')}`);
  startScheduler(cache);
});
