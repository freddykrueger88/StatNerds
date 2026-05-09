require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

// Live Bundesliga (kein API-Key nötig!)
app.get('/api/games/bl1', async (req, res) => {
  try {
    const response = await axios.get('https://api.openligadb.de/getmatchdata/bl1/2025/34');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'OpenLigaDB nicht erreichbar', details: err.message });
  }
});

// Team-Details via TheSportsDB
app.get('/api/teams/:apiId', async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${req.params.apiId}`
    );
    const team = response.data.teams[0];
    res.json({
      name: team.strTeam,
      logo: team.strTeamBadge,
      stadium: team.strStadium,
      country: team.strCountry,
      founded: team.intFormedYear,
      description: team.strDescriptionDE || team.strDescriptionEN
    });
  } catch (err) {
    res.status(500).json({ error: 'TheSportsDB nicht erreichbar', details: err.message });
  }
});

// Gewinnwahrscheinlichkeit (Phase 4: wird mit echten Daten befüllt)
app.get('/api/games/:id/prediction', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stats WHERE game_id = $1',
      [req.params.id]
    );
    // Vereinfachter Algorithmus auf Basis xG
    const stats = result.rows;
    const homexg = stats.find(s => s.is_home)?.xg || 1.2;
    const awayxg = stats.find(s => !s.is_home)?.xg || 0.8;
    const total = homexg + awayxg + 0.5;
    res.json({
      game_id: req.params.id,
      home_win: Math.round((homexg / total) * 100 * 10) / 10,
      draw: Math.round((0.5 / total) * 100 * 10) / 10,
      away_win: Math.round((awayxg / total) * 100 * 10) / 10,
      based_on: 'xG'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DB Bereinigung (Einstellungen-Feature)
app.delete('/api/stats/cleanup', async (req, res) => {
  const { days } = req.query; // ?days=14
  try {
    const result = await pool.query(
      'DELETE FROM stats WHERE updated_at < NOW() - INTERVAL \'1 day\' * $1',
      [parseInt(days) || 30]
    );
    res.json({ deleted: result.rowCount, days_threshold: days || 30 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`StatNerds Backend auf http://localhost:${PORT}`);
});
