const express = require('express');
const axios = require('axios');
const router = express.Router();

// Cache
const cache = {};
function getCache(key) {
  const e = cache[key];
  if (!e || Date.now() - e.ts > e.ttl) { delete cache[key]; return null; }
  return e.data;
}
function setCache(key, data, ttlMs) { cache[key] = { data, ts: Date.now(), ttl: ttlMs }; }

function apiClient(apiKey) {
  return axios.create({
    baseURL: 'https://v3.football.api-sports.io',
    headers: { 'x-apisports-key': apiKey },
  });
}

// Hilfsfunktion: API-Key aus Header oder Env
function getKey(req) {
  return req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY || null;
}

// Live-Spiele Bundesliga
router.get('/live', async (req, res) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key ben\u00f6tigt' });
  try {
    const cacheKey = 'apif_live';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const r = await apiClient(key).get('/fixtures?live=all&league=78&season=2025');
    setCache(cacheKey, r.data, 60 * 1000); // 1 min
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Spiel-Statistiken (xG, Sch\u00fcsse, Ballbesitz)
router.get('/stats/:fixtureId', async (req, res) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key ben\u00f6tigt' });
  const { fixtureId } = req.params;
  const cacheKey = `apif_stats_${fixtureId}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);
  try {
    const [statsRes, eventsRes, lineupRes] = await Promise.all([
      apiClient(key).get(`/fixtures/statistics?fixture=${fixtureId}`),
      apiClient(key).get(`/fixtures/events?fixture=${fixtureId}`),
      apiClient(key).get(`/fixtures/lineups?fixture=${fixtureId}`),
    ]);

    const stats = statsRes.data?.response || [];
    const parse = (teamStats, statName) =>
      teamStats?.statistics?.find(s => s.type === statName)?.value ?? null;

    const result = {
      home: {
        name: stats[0]?.team?.name,
        logo: stats[0]?.team?.logo,
        xG:           parse(stats[0], 'expected_goals'),
        shots:        parse(stats[0], 'Total Shots'),
        shotsOnTarget:parse(stats[0], 'Shots on Goal'),
        possession:   parse(stats[0], 'Ball Possession'),
        corners:      parse(stats[0], 'Corner Kicks'),
        fouls:        parse(stats[0], 'Fouls'),
        yellowCards:  parse(stats[0], 'Yellow Cards'),
        redCards:     parse(stats[0], 'Red Cards'),
        passes:       parse(stats[0], 'Total passes'),
        passAccuracy: parse(stats[0], 'Passes %'),
      },
      away: {
        name: stats[1]?.team?.name,
        logo: stats[1]?.team?.logo,
        xG:           parse(stats[1], 'expected_goals'),
        shots:        parse(stats[1], 'Total Shots'),
        shotsOnTarget:parse(stats[1], 'Shots on Goal'),
        possession:   parse(stats[1], 'Ball Possession'),
        corners:      parse(stats[1], 'Corner Kicks'),
        fouls:        parse(stats[1], 'Fouls'),
        yellowCards:  parse(stats[1], 'Yellow Cards'),
        redCards:     parse(stats[1], 'Red Cards'),
        passes:       parse(stats[1], 'Total passes'),
        passAccuracy: parse(stats[1], 'Passes %'),
      },
      events: eventsRes.data?.response || [],
      lineups: lineupRes.data?.response || [],
    };
    setCache(cacheKey, result, 2 * 60 * 1000); // 2 min
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schiedsrichter + TV-Sender f\u00fcr ein Spiel
router.get('/fixture/:fixtureId', async (req, res) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key ben\u00f6tigt' });
  const { fixtureId } = req.params;
  const country = req.query.country || 'Germany';
  const cacheKey = `apif_fixture_${fixtureId}_${country}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await apiClient(key).get(`/fixtures?id=${fixtureId}`);
    const fixture = r.data?.response?.[0];
    if (!fixture) return res.status(404).json({ error: 'Spiel nicht gefunden' });

    const result = {
      referee: fixture.fixture?.referee || null,
      venue: {
        name: fixture.fixture?.venue?.name,
        city: fixture.fixture?.venue?.city,
      },
      broadcast: (fixture.fixture?.periods || []),
    };
    setCache(cacheKey, result, 60 * 60 * 1000); // 1h
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bundesliga Spielplan Saison 2025 (f\u00fcr Fixture-ID Mapping)
router.get('/schedule', async (req, res) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key ben\u00f6tigt' });
  const round = req.query.round;
  const cacheKey = `apif_schedule_${round || 'current'}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);
  try {
    const params = { league: 78, season: 2025 };
    if (round) params.round = round;
    const r = await apiClient(key).get('/fixtures', { params });
    const matches = (r.data?.response || []).map(f => ({
      fixtureId: f.fixture.id,
      date: f.fixture.date,
      referee: f.fixture.referee,
      home: f.teams.home.name,
      away: f.teams.away.name,
      homeLogo: f.teams.home.logo,
      awayLogo: f.teams.away.logo,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status: f.fixture.status.short,
      round: f.league.round,
      venue: f.fixture.venue?.name,
    }));
    setCache(cacheKey, matches, 10 * 60 * 1000); // 10 min
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
