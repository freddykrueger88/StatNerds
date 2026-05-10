const express = require('express');
const axios = require('axios');
const cache = require('../cache');
const router = express.Router();

// Bundesliga Schiedsrichter-Stammdaten (bekannte SR der Saison 25/26)
const REFEREES = {
  'Felix Brych':        { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'FIFA-Schiedsrichter seit 2004, Champions-League-Finalist 2017' },
  'Daniel Siebert':     { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Berliner SR, Olympia 2020 & EM 2020' },
  'Tobias Stieler':     { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Hamburger SR, Bundesliga seit 2010' },
  'Christian Dingert':  { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Lebendige Spielleitung, bekannt für wenig Karten' },
  'Sascha Stegemann':   { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Niederrhein-SR, seit 2013 Erstliga' },
  'Marco Fritz':        { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Württemberg-SR, FIFA seit 2014' },
  'Harm Osmers':        { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Niedersachsen-SR, schnell aufgestiegen' },
  'Benjamin Cortus':    { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Bayern-SR, ruhige Spielleitung' },
  'Robert Schroeder':   { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'SR aus Nordrhein' },
  'Patrick Ittrich':    { nationality: 'DE', matches: 0, yellowCards: 0, redCards: 0, bio: 'Hamburger SR, Bundesliga seit 2014' },
};

// Schiedsrichter für einen Spieltag aus OpenLigaDB aggregieren
router.get('/bl1/matchday/:matchday', async (req, res) => {
  const md = req.params.matchday;
  const cacheKey = `referee_md_${md}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const r = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`);
    const result = r.data.map(m => ({
      matchId: m.matchID,
      home: m.team1?.shortName || m.team1?.teamName,
      away: m.team2?.shortName || m.team2?.teamName,
      referee: null, // OpenLigaDB liefert keinen SR – Platzhalter für API-Football
      date: m.matchDateTime,
    }));
    cache.set(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schiedsrichter-Profil
router.get('/profile/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const profile = REFEREES[name];
  if (!profile) return res.json({ name, nationality: 'DE', bio: null });
  res.json({ name, ...profile });
});

// Schiedsrichter-Liste (alle bekannten)
router.get('/', (req, res) => {
  const list = Object.entries(REFEREES).map(([name, data]) => ({ name, ...data }));
  res.json(list);
});

// Schiedsrichter-Stats aus API-Football (wenn Key vorhanden)
router.get('/apif/:fixtureId', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY;
  if (!apiKey) return res.status(401).json({ error: 'API-Football Key benötigt' });
  const { fixtureId } = req.params;
  const cacheKey = `referee_apif_${fixtureId}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await axios.get(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
      headers: { 'x-apisports-key': apiKey }
    });
    const fix = r.data?.response?.[0];
    const referee = fix?.fixture?.referee || null;
    const result = { fixtureId, referee, venue: fix?.fixture?.venue };
    cache.set(cacheKey, result, 6 * 60 * 60 * 1000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
