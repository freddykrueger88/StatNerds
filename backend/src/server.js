require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cache = require('./cache');
const startScheduler = require('./scheduler');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter, cleanupLimiter } = require('./middleware/rateLimiter');
const { requireApiKey } = require('./middleware/requireApiKey');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS: nur erlaubte Origins zulassen
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Requests ohne Origin (z.B. curl, Postman) in dev erlauben
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} nicht erlaubt.`));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

// Rate-Limiting auf alle Routen
app.use(apiLimiter);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '0.5.1', timestamp: new Date().toISOString(), cache: cache.stats() });
});

// Routen
app.use('/games',       require('./routes/games'));
app.use('/teams',       require('./routes/teams'));
app.use('/teamstats',   require('./routes/teamstats'));
app.use('/prediction',  require('./routes/prediction'));
app.use('/apifootball', require('./routes/apifootball'));
app.use('/broadcast',   require('./routes/broadcast').router);
app.use('/referee',     require('./routes/referee'));

// Cleanup – geschützt durch API-Key + strenges Rate-Limit
app.delete('/stats/cleanup', cleanupLimiter, requireApiKey, async (req, res) => {
  const { days } = req.query;
  try {
    let result;
    if (parseInt(days) === 0) result = await pool.query('DELETE FROM stats');
    else result = await pool.query(`DELETE FROM stats WHERE updated_at < NOW() - INTERVAL '1 day' * $1`, [parseInt(days) || 30]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`\n📊 StatNerds Backend v0.5.1 → http://localhost:${PORT}`);
  console.log(`🔒 CORS erlaubte Origins: ${allowedOrigins.join(', ')}`);
  startScheduler(cache);
});
