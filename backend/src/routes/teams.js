const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Team-Details via TheSportsDB
router.get('/:apiId', async (req, res) => {
  try {
    // Erst DB prüfen
    const cached = await pool.query('SELECT * FROM teams WHERE sportsdb_api_id = $1', [req.params.apiId]);
    if (cached.rows.length > 0) return res.json(cached.rows[0]);

    // Sonst API abrufen
    const response = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${req.params.apiId}`
    );
    const t = response.data.teams[0];
    const team = {
      name: t.strTeam,
      logo_url: t.strTeamBadge,
      primary_color: t.strTeamJersey ? '#' + t.strTeamJersey.slice(1, 7) : '#000000',
      country: t.strCountry,
      stadium: t.strStadium,
      founded: t.intFormedYear,
      description: t.strDescriptionDE || t.strDescriptionEN
    };

    // In DB speichern
    await pool.query(
      `INSERT INTO teams (name, logo_url, primary_color, country, stadium, founded, sportsdb_api_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (name) DO NOTHING`,
      [team.name, team.logo_url, team.primary_color, team.country, team.stadium, team.founded, req.params.apiId]
    );

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
