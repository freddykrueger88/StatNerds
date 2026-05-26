const express = require('express');
const axios   = require('axios');
const cache   = require('../cache'); // zentraler Cache statt lokalem Objekt

const router = express.Router();

function apiClient(apiKey) {
  return axios.create({
    baseURL: 'https://v3.football.api-sports.io',
    headers: { 'x-apisports-key': apiKey },
    timeout: 8000,
  });
}

function getKey(req) {
  return req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY || null;
}

// ── GET /api/apifootball/live ──────────────────────────────────────────────
router.get('/live', async (req, res, next) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key benötigt' });
  try {
    const cacheKey = 'apif_live';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const r = await apiClient(key).get('/fixtures?live=all&league=78&season=2025');
    cache.set(cacheKey, r.data, 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

// ── GET /api/apifootball/stats/:fixtureId ───────────────────────────────
router.get('/stats/:fixtureId', async (req, res, next) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key benötigt' });
  const { fixtureId } = req.params;
  const cacheKey = `apif_stats_${fixtureId}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const client = apiClient(key);
    const [statsRes, eventsRes, lineupRes] = await Promise.all([
      client.get(`/fixtures/statistics?fixture=${fixtureId}`),
      client.get(`/fixtures/events?fixture=${fixtureId}`),
      client.get(`/fixtures/lineups?fixture=${fixtureId}`),
    ]);
    const stats = statsRes.data?.response || [];
    const parse = (teamStats, statName) =>
      teamStats?.statistics?.find(s => s.type === statName)?.value ?? null;
    const side = (i) => ({
      name:         stats[i]?.team?.name,
      logo:         stats[i]?.team?.logo,
      xG:           parse(stats[i], 'expected_goals'),
      shots:        parse(stats[i], 'Total Shots'),
      shotsOnTarget:parse(stats[i], 'Shots on Goal'),
      possession:   parse(stats[i], 'Ball Possession'),
      corners:      parse(stats[i], 'Corner Kicks'),
      fouls:        parse(stats[i], 'Fouls'),
      yellowCards:  parse(stats[i], 'Yellow Cards'),
      redCards:     parse(stats[i], 'Red Cards'),
      passes:       parse(stats[i], 'Total passes'),
      passAccuracy: parse(stats[i], 'Passes %'),
    });
    const result = {
      home: side(0),
      away: side(1),
      events:  eventsRes.data?.response || [],
      lineups: lineupRes.data?.response || [],
    };
    cache.set(cacheKey, result, 2 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

// ── GET /api/apifootball/fixture/:fixtureId ────────────────────────────
router.get('/fixture/:fixtureId', async (req, res, next) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key benötigt' });
  const { fixtureId } = req.params;
  const country  = req.query.country || 'Germany';
  const cacheKey = `apif_fixture_${fixtureId}_${country}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await apiClient(key).get(`/fixtures?id=${fixtureId}`);
    const fixture = r.data?.response?.[0];
    if (!fixture) return res.status(404).json({ error: 'Spiel nicht gefunden' });
    const result = {
      referee:   fixture.fixture?.referee || null,
      venue: {
        name: fixture.fixture?.venue?.name,
        city: fixture.fixture?.venue?.city,
      },
      broadcast: fixture.fixture?.periods || [],
    };
    cache.set(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

// ── GET /api/apifootball/schedule ──────────────────────────────────────────
router.get('/schedule', async (req, res, next) => {
  const key = getKey(req);
  if (!key) return res.status(401).json({ error: 'API-Football Key benötigt' });
  const round    = req.query.round;
  const cacheKey = `apif_schedule_${round || 'current'}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const params = { league: 78, season: 2025 };
    if (round) params.round = round;
    const r = await apiClient(key).get('/fixtures', { params });
    const matches = (r.data?.response || []).map(f => ({
      fixtureId:  f.fixture.id,
      date:       f.fixture.date,
      referee:    f.fixture.referee,
      home:       f.teams.home.name,
      away:       f.teams.away.name,
      homeLogo:   f.teams.home.logo,
      awayLogo:   f.teams.away.logo,
      homeScore:  f.goals.home,
      awayScore:  f.goals.away,
      status:     f.fixture.status.short,
      round:      f.league.round,
      venue:      f.fixture.venue?.name,
    }));
    cache.set(cacheKey, matches, 10 * 60 * 1000);
    res.json(matches);
  } catch (err) { next(err); }
});

module.exports = router;
