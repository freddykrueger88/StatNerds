require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '0.2.0', timestamp: new Date().toISOString() });
});

// DB Test
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

// Routen
app.use('/games', require('./routes/games'));
app.use('/teams', require('./routes/teams'));
app.use('/prediction', require('./routes/prediction'));

// DB Bereinigung
app.delete('/stats/cleanup', async (req, res) => {
  const { days } = req.query;
  try {
    const result = await pool.query(
      `DELETE FROM stats WHERE updated_at < NOW() - INTERVAL '1 day' * $1`,
      [parseInt(days) || 30]
    );
    res.json({ deleted: result.rowCount, days_threshold: days || 30 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`StatNerds Backend v0.2.0 auf http://localhost:${PORT}`);
  console.log(`Routen: /health /games/bl1 /games/bl1/current /games/bl1/table /prediction?team1=X&team2=Y`);
});
