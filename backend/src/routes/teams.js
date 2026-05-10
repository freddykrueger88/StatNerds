const express = require('express');
const axios = require('axios');
const router = express.Router();

// In-Memory Cache
const cache = {};
function getCache(key) {
  const e = cache[key];
  if (!e || Date.now() - e.ts > e.ttl) { delete cache[key]; return null; }
  return e.data;
}
function setCache(key, data, ttlMs) { cache[key] = { data, ts: Date.now(), ttl: ttlMs }; }

// Bekannte Bundesliga-Vereine mit TheSportsDB-IDs
const BUNDESLIGA_TEAMS = [
  { id: '133613', name: 'FC Bayern M\u00fcnchen', short: 'Bayern' },
  { id: '133614', name: 'Borussia Dortmund', short: 'BVB' },
  { id: '133615', name: 'Bayer 04 Leverkusen', short: 'Leverkusen' },
  { id: '133616', name: 'RB Leipzig', short: 'Leipzig' },
  { id: '133617', name: 'Eintracht Frankfurt', short: 'Frankfurt' },
  { id: '133618', name: 'VfL Wolfsburg', short: 'Wolfsburg' },
  { id: '133619', name: 'Borussia M\u00f6nchengladbach', short: 'Gladbach' },
  { id: '133620', name: 'TSG 1899 Hoffenheim', short: 'Hoffenheim' },
  { id: '133621', name: 'VfB Stuttgart', short: 'Stuttgart' },
  { id: '133622', name: 'SC Freiburg', short: 'Freiburg' },
  { id: '134', name: 'Werder Bremen', short: 'Bremen' },
  { id: '133624', name: 'FC Augsburg', short: 'Augsburg' },
  { id: '133625', name: 'Union Berlin', short: 'Union' },
  { id: '133626', name: '1. FC K\u00f6ln', short: 'K\u00f6ln' },
  { id: '133627', name: 'FSV Mainz 05', short: 'Mainz' },
  { id: '133628', name: '1. FC Heidenheim', short: 'Heidenheim' },
  { id: '133629', name: 'SV Darmstadt 98', short: 'Darmstadt' },
  { id: '133630', name: 'VfL Bochum', short: 'Bochum' },
];

// Alle Bundesliga-Teams (f\u00fcr Dropdown/Suche)
router.get('/', async (req, res) => {
  res.json(BUNDESLIGA_TEAMS);
});

// Suche nach Teamname (fuzzy)
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json(BUNDESLIGA_TEAMS);
  const results = BUNDESLIGA_TEAMS.filter(t =>
    t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)
  );
  res.json(results);
});

// Team-Details via TheSportsDB
router.get('/:sportsdbId', async (req, res) => {
  const { sportsdbId } = req.params;
  const cacheKey = `team_${sportsdbId}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${sportsdbId}`
    );
    const t = response.data?.teams?.[0];
    if (!t) return res.status(404).json({ error: 'Team nicht gefunden' });

    const team = {
      id: sportsdbId,
      name: t.strTeam,
      shortName: t.strTeamShort || t.strTeam,
      logoUrl: t.strTeamBadge,
      fanartUrl: t.strTeamFanart1 || t.strTeamBanner,
      jerseyUrl: t.strTeamJersey,
      stadiumName: t.strStadium,
      stadiumThumb: t.strStadiumThumb,
      stadiumCapacity: t.intStadiumCapacity,
      stadiumLocation: t.strStadiumLocation,
      country: t.strCountry,
      founded: t.intFormedYear,
      league: t.strLeague,
      website: t.strWebsite,
      facebook: t.strFacebook,
      instagram: t.strInstagram,
      descriptionDE: t.strDescriptionDE,
      descriptionEN: t.strDescriptionEN,
    };

    setCache(cacheKey, team, 24 * 60 * 60 * 1000); // 24h Cache
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'TheSportsDB nicht erreichbar', details: err.message });
  }
});

module.exports = router;
