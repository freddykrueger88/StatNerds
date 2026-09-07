'use strict';

const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// ── Formel 1 – Jolpica/Ergast API (keyless) ────────────────────────────
// (Issue #26): Fahrer- und Konstrukteurs-WM, Rennresultate, Startreihenfolge.
// Die API ist keylos über api.jolpi.ca verfügbar (Ergast-Mirror).
const BASE = 'https://api.jolpi.ca/ergast/f1';

const opts = { timeout: 10000, validateStatus: st => st < 500 };

async function f1Get(url, cacheKey, ttl) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const r = await axios.get(url, opts);
  if (r.status !== 200 || !r.data) {
    const err = new Error(`F1 '${url}' fehlgeschlagen (Status ${r.status})`);
    err.status = 502;
    throw err;
  }
  cache.set(cacheKey, r.data, ttl);
  return r.data;
}

// Aktuelle Saison ableiten (oder query ?season=2026)
const f1Season = () => new Date().getFullYear();

// ── GET /api/f1/drivers — Fahrer-WM ────────────────────────────────────────
router.get('/drivers', async (req, res, next) => {
  try {
    const season = req.query.season || f1Season();
    const raw = await f1Get(`${BASE}/${season}/driverStandings.json`, `f1_drv_${season}`, 30 * 60 * 1000);
    const list = raw.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    const drivers = list.map(d => ({
      pos: parseInt(d.position) || 0,
      points: parseFloat(d.points) || 0,
      wins: parseInt(d.wins) || 0,
      driver: {
        id: d.Driver?.driverId || '',
        name: `${d.Driver?.givenName || ''} ${d.Driver?.familyName || ''}`.trim(),
        nationality: d.Driver?.nationality || '',
        number: d.Driver?.permanentNumber || d.Driver?.code || '',
        code: d.Driver?.code || '',
      },
      team: d.Constructors?.[0]?.name || '',
    }));
    res.json({ season, drivers });
  } catch (err) { next(err); }
});

// ── GET /api/f1/constructors — Konstrukteurs-WM ────────────────────────────
router.get('/constructors', async (req, res, next) => {
  try {
    const season = req.query.season || f1Season();
    const raw = await f1Get(`${BASE}/${season}/constructorStandings.json`, `f1_ctor_${season}`, 30 * 60 * 1000);
    const list = raw.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
    const constructors = list.map(c => ({
      pos: parseInt(c.position) || 0,
      points: parseFloat(c.points) || 0,
      wins: parseInt(c.wins) || 0,
      name: c.Constructor?.name || '',
      nationality: c.Constructor?.nationality || '',
    }));
    res.json({ season, constructors });
  } catch (err) { next(err); }
});

// ── GET /api/f1/schedule — Rennkalender ─────────────────────────────────────
router.get('/schedule', async (req, res, next) => {
  try {
    const season = req.query.season || f1Season();
    const raw = await f1Get(`${BASE}/${season}.json`, `f1_sched_${season}`, 60 * 60 * 1000);
    const races = raw.MRData?.RaceTable?.Races || [];
    const schedule = races.map(r => ({
      round: parseInt(r.round) || 0,
      name: r.raceName || '',
      circuit: r.Circuit?.circuitName || '',
      locality: r.Circuit?.Location?.locality || '',
      country: r.Circuit?.Location?.country || '',
      date: r.date || null,
      time: r.time || null,
      url: r.url || null,
    }));
    res.json({ season, schedule });
  } catch (err) { next(err); }
});

// ── GET /api/f1/results/:round — Rennresultat ───────────────────────────────
router.get('/results/:round', async (req, res, next) => {
  try {
    const season = req.query.season || f1Season();
    const round = req.params.round;
    const raw = await f1Get(`${BASE}/${season}/${round}/results.json`, `f1_res_${season}_${round}`, 60 * 60 * 1000);
    const race = raw.MRData?.RaceTable?.Races?.[0] || {};
    const results = (race.Results || []).map(r => ({
      pos: parseInt(r.position) || 0,
      points: parseFloat(r.points) || 0,
      driver: {
        id: r.Driver?.driverId || '',
        name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim(),
        code: r.Driver?.code || '',
      },
      team: r.Constructor?.name || '',
      grid: parseInt(r.grid) || 0,
      laps: parseInt(r.laps) || 0,
      status: r.Status?.status || r.status || '',
      time: r.Time?.time || '',
      fastestLap: r.FastestLap?.rank === '1' || false,
      fastestLapTime: r.FastestLap?.rank === '1' ? r.FastestLap.Time?.time || '' : '',
    }));
    res.json({
      season,
      round: parseInt(round),
      race: {
        name: race.raceName || '',
        date: race.date || null,
        time: race.time || null,
        circuit: race.Circuit?.circuitName || '',
        locality: race.Circuit?.Location?.locality || '',
        country: race.Circuit?.Location?.country || '',
      },
      results,
    });
  } catch (err) { next(err); }
});

// ── GET /api/f1/lap-times/:round — Stopzeiten (Top-10) ──────────────────────
router.get('/lap-times/:round', async (req, res, next) => {
  try {
    const season = req.query.season || f1Season();
    const round = req.params.round;
    const raw = await f1Get(`${BASE}/${season}/${round}/pitstops.json?limit=200`, `f1_pits_${season}_${round}`, 60 * 60 * 1000);
    const stops = (raw.MRData?.RaceTable?.Races?.[0]?.PitStops || []).slice(0, 20);
    res.json({ season, round: parseInt(round), stops });
  } catch (err) { next(err); }
});

module.exports = router;
