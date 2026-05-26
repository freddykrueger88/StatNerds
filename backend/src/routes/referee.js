const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');
const router  = express.Router();

const REFEREES = {
  'Felix Brych':       { nationality: 'DE', bio: 'FIFA-Schiedsrichter seit 2004, Champions-League-Finalist 2017' },
  'Daniel Siebert':    { nationality: 'DE', bio: 'Berliner SR, Olympia 2020 & EM 2020' },
  'Tobias Stieler':    { nationality: 'DE', bio: 'Hamburger SR, Bundesliga seit 2010' },
  'Christian Dingert': { nationality: 'DE', bio: 'Lebendige Spielleitung, bekannt für wenig Karten' },
  'Sascha Stegemann':  { nationality: 'DE', bio: 'Niederrhein-SR, seit 2013 Erstliga' },
  'Marco Fritz':       { nationality: 'DE', bio: 'Württemberg-SR, FIFA seit 2014' },
  'Harm Osmers':       { nationality: 'DE', bio: 'Niedersachsen-SR, schnell aufgestiegen' },
  'Benjamin Cortus':   { nationality: 'DE', bio: 'Bayern-SR, ruhige Spielleitung' },
  'Robert Schroeder':  { nationality: 'DE', bio: 'SR aus Nordrhein' },
  'Patrick Ittrich':   { nationality: 'DE', bio: 'Hamburger SR, Bundesliga seit 2014' },
};

router.get('/bl1/matchday/:matchday', async (req, res, next) => {
  const md       = req.params.matchday;
  const cacheKey = `referee_md_${md}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`);
    const result = r.data.map(m => ({
      matchId:  m.matchID,
      home:     m.team1?.shortName || m.team1?.teamName,
      away:     m.team2?.shortName || m.team2?.teamName,
      referee:  null,
      date:     m.matchDateTime,
    }));
    cache.set(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/profile/:name', (req, res) => {
  const name    = decodeURIComponent(req.params.name);
  const profile = REFEREES[name];
  if (!profile) return res.json({ name, nationality: 'DE', bio: null });
  res.json({ name, ...profile });
});

router.get('/', (req, res) => {
  res.json(Object.entries(REFEREES).map(([name, data]) => ({ name, ...data })));
});

router.get('/apif/:fixtureId', async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY;
  if (!apiKey) return res.status(401).json({ error: 'API-Football Key benötigt' });
  const { fixtureId } = req.params;
  const cacheKey = `referee_apif_${fixtureId}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await axios.get(
      `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
      { headers: { 'x-apisports-key': apiKey }, timeout: 8000 }
    );
    const fix    = r.data?.response?.[0];
    const result = { fixtureId, referee: fix?.fixture?.referee || null, venue: fix?.fixture?.venue };
    cache.set(cacheKey, result, 6 * 60 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
