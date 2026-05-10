require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cache = require('./cache');
const startScheduler = require('./scheduler');
const { globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '0.5.1', timestamp: new Date().toISOString(), cache: cache.stats() });
});

app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({ db: 'connected', time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/games',       require('./routes/games'));
app.use('/teams',       require('./routes/teams'));
app.use('/teamstats',   require('./routes/teamstats'));
app.use('/prediction',  require('./routes/prediction'));
app.use('/apifootball', require('./routes/apifootball'));
app.use('/broadcast',   require('./routes/broadcast').router);

app.delete('/stats/cleanup', async (req, res) => {
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
  startScheduler(cache);
});
