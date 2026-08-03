'use strict';

const express      = require('express');
const axios        = require('axios');
const cache        = require('../cache');
const { getAdapter } = require('../adapters');

const router = express.Router();

function buildClient(apiKey) {
  return axios.create({
    baseURL: 'https://v3.football.api-sports.io',
    headers: { 'x-apisports-key': apiKey },
    timeout: 8000,
  });
}

function getKey(req) {
  return req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY || null;
}

// Gemeinsamer Guard: API-Key + Adapter-Lookup
function resolveAdapter(req, res) {
  const key = getKey(req);
  if (!key) { res.status(401).json({ error: 'API-Football Key benötigt' }); return null; }
  const league = req.params.league || req.query.league || 'bundesliga';
  try {
    return getAdapter(league, buildClient(key));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
    return null;
  }
}

// ── GET /api/apifootball/:league/live ──────────────────────────────────
router.get('/:league/live', async (req, res, next) => {
  const adapter = resolveAdapter(req, res);
  if (!adapter) return;
  const cacheKey = `apif_${req.params.league}_live`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const data = await adapter.getLive();
    cache.set(cacheKey, data, 60 * 1000);
    res.json(data);
  } catch (err) { next(err); }
});

// ── GET /api/apifootball/:league/schedule ──────────────────────────────
router.get('/:league/schedule', async (req, res, next) => {
  const adapter = resolveAdapter(req, res);
  if (!adapter) return;
  const { round } = req.query;
  const cacheKey = `apif_${req.params.league}_schedule_${round || 'current'}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const data = await adapter.getSchedule(round);
    cache.set(cacheKey, data, 10 * 60 * 1000);
    res.json(data);
  } catch (err) { next(err); }
});

// ── GET /api/apifootball/:league/stats/:fixtureId ──────────────────────
router.get('/:league/stats/:fixtureId', async (req, res, next) => {
  const adapter = resolveAdapter(req, res);
  if (!adapter) return;
  const { fixtureId, league } = req.params;
  const cacheKey = `apif_${league}_stats_${fixtureId}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const data = await adapter.getFixtureStats(fixtureId);
    cache.set(cacheKey, data, 2 * 60 * 1000);
    res.json(data);
  } catch (err) { next(err); }
});

// ── GET /api/apifootball/:league/fixture/:fixtureId ────────────────────
router.get('/:league/fixture/:fixtureId', async (req, res, next) => {
  const adapter = resolveAdapter(req, res);
  if (!adapter) return;
  const { fixtureId, league } = req.params;
  const cacheKey = `apif_${league}_fixture_${fixtureId}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const data = await adapter.getFixture(fixtureId);
    cache.set(cacheKey, data, 60 * 60 * 1000);
    res.json(data);
  } catch (err) { next(err); }
});

// Backwards-Compat: alte Routen ohne /:league → fallback auf bundesliga
router.get('/live',                  (req, res) => res.redirect(301, '/api/apifootball/bundesliga/live'));
router.get('/schedule',              (req, res) => res.redirect(301, '/api/apifootball/bundesliga/schedule'));
router.get('/stats/:id',             (req, res) => res.redirect(301, `/api/apifootball/bundesliga/stats/${req.params.id}`));
router.get('/fixture/:id',           (req, res) => res.redirect(301, `/api/apifootball/bundesliga/fixture/${req.params.id}`));

module.exports = router;
