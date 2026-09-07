'use strict';

const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// ── NHL – offizielle Public API (keyless, api-web.nhle.com) ──────────────
// Eishockey (Issue #25). Spielplan, Tabelle und Torschützen liefert die
// NHL offizielle, unauthentifizierte API. Alle Antworten werden gecacht.
// DEL: keine öffentliche API verfügbar (penny-del.org → 404 ohne Auth) –
// wird daher ehrlich in der UI als Nicht verfügbar gekennzeichnet.
const BASE = 'https://api-web.nhle.com';

const opts = {
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) StatNerds/1.0' },
  validateStatus: st => st < 500,
};

async function nhlGet(url, cacheKey, ttl) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const r = await axios.get(url, opts);
  if (r.status !== 200 || !r.data) {
    const err = new Error(`NHL '${url}' fehlgeschlagen (Status ${r.status})`);
    err.status = 502;
    throw err;
  }
  cache.set(cacheKey, r.data, ttl);
  return r.data;
}

// Aktuelle NHL-Saison als URL-Baustein (z.B. '20252026' für Saison 2025/26).
// NHL-Saison startet Anfang Oktober: vor Oktober läuft die Saison des Vorjahres
// (Sept 2026 → 20252026), danach die neue (20262027). Format: Startjahr+Endjahr.
const nhlSeason = () => {
  const now = new Date();
  const fy = now.getFullYear();
  return now.getMonth() + 1 >= 10 ? `${fy}${fy + 1}` : `${fy - 1}${fy}`;
};

// ── Mapping: Teams/Scores ─────────────────────────────────────────────────
function teamInfo(t) {
  return {
    id: t?.id || null,
    abbrev: t?.abbrev || '',
    name: (t?.placeName?.default ? `${t.placeName.default} ` : '') + (t?.commonName?.default || ''),
    logo: t?.logo || null,
  };
}

// ── GET /api/nhl/current — laufende Woche (Scores + Status) ────────────────
router.get('/current', async (req, res, next) => {
  try {
    // Kalendertag für "/schedule/now" simulieren: aktuelles Datum in lokaler Zeit
    const today = new Date();
    const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const raw = await nhlGet(`${BASE}/v1/schedule/${day}`, `nhl_sched_${day}`, 3 * 60 * 1000);

    const games = (raw.gameWeek || []).flatMap(w =>
      (w.games || []).map(g => ({
        id: g.id,
        date: g.startTimeUTC || w.date,
        state: g.gameState || 'FUT', // FUT / PRE / LIVE / OFF
        status: g.gameState === 'OFF' ? 'Beendet' : g.gameState === 'LIVE' ? 'LIVE' : 'Geplant',
        live: g.gameState === 'LIVE',
        completed: g.gameState === 'OFF' || g.gameState === 'FINAL',
        score: (g.gameState === 'OFF' || g.gameState === 'LIVE') && g.score
          ? { home: g.score.home ?? 0, away: g.score.away ?? 0 }
          : null,
        period: g.periodDescriptor ? `P${g.periodDescriptor.number}` : null,
        venue: g.venue?.default || '',
        home: teamInfo(g.homeTeam),
        away: teamInfo(g.awayTeam),
        tv: (g.tvBroadcasts || []).map(b => b.network).filter(Boolean).slice(0, 2),
      }))
    );
    res.json({ league: 'nhl', games, weekStart: raw.nextStartDate || day });
  } catch (err) { next(err); }
});

// ── GET /api/nhl/standings — Tabelle (Konferenzen/Divisionen) ───────────────
router.get('/standings', async (req, res, next) => {
  try {
    const raw = await nhlGet(`${BASE}/v1/standings/now`, 'nhl_standings', 30 * 60 * 1000);
    const rows = (raw.standings || []).map(s => ({
      team: {
        id: s.teamAbbrev?.default ? null : s.leagueSequence,
        abbrev: s.teamAbbrev?.default || s.teamAbbrev || '',
        name: s.teamName?.default || s.teamAbbrev?.default || '',
        logo: s.teamLogo || null,
      },
      conference: s.conferenceName || s.conferenceAbbrev || '',
      division: s.divisionName || s.divisionAbbrev || '',
      wins: s.wins ?? 0,
      losses: s.losses ?? 0,
      ot: s.otLosses ?? 0,
      points: s.points ?? 0,
      gp: s.gamesPlayed ?? 0,
      l10: typeof s.l10 === 'string' ? s.l10.split('-').slice(0, 2).join('-') : s.l10 ?? '',
      streak: s.streakInfo?.streakCode || '',
      runDiff: s.goalDifferential ?? null,
    }));
    res.json({ league: 'nhl', conferences: ['Eastern', 'Western'], rows });
  } catch (err) { next(err); }
});

// ── GET /api/nhl/leaders — Torschützen (Top-20) ──────────────────────────────
// Versucht die aktuelle Saison; falls sie noch keine Statistik hat (Saisonende),
// wird automatisch auf die Vorsaison zurückgegriffen.
router.get('/leaders', async (req, res, next) => {
  try {
    let season = req.query.season || nhlSeason();
    let raw;
    try {
      raw = await nhlGet(`${BASE}/v1/skater-stats-leaders/${season}/2?categories=goals&limit=20`, `nhl_leaders_${season}`, 60 * 60 * 1000);
    } catch (e) {
      if (req.query.season) throw e;
      const fy = parseInt(season.slice(0, 4), 10) - 1;
      season = `${fy}${fy + 1}`;
      raw = await nhlGet(`${BASE}/v1/skater-stats-leaders/${season}/2?categories=goals&limit=20`, `nhl_leaders_${season}`, 60 * 60 * 1000);
    }
    const goals = (raw.goalsSh || raw.goals || []).map(p => ({
      id: p.id,
      name: `${p.firstName?.default || ''} ${p.lastName?.default || ''}`.trim(),
      team: p.teamAbbrev || '',
      goals: p.value ?? p.goals ?? null,
      games: p.gamesPlayed ?? null,
      assists: p.assists ?? null,
      points: p.points ?? null,
      headshot: p.headshot || null,
    }));
    res.json({ league: 'nhl', season, goals });
  } catch (err) { next(err); }
});

// ── GET /api/nhl/teams — alle 32 Franchises (aus der Tabelle) ────────────────
router.get('/teams', async (req, res, next) => {
  try {
    const raw = await nhlGet(`${BASE}/v1/standings/now`, 'nhl_standings', 30 * 60 * 1000);
    const seen = new Set();
    const teams = [];
    for (const s of raw.standings || []) {
      const id = s.teamAbbrev?.default || s.teamAbbrev || '';
      if (seen.has(id)) continue;
      seen.add(id);
      teams.push({
        id: id.toLowerCase(),
        name: s.teamName?.default || id,
        short: id,
        logo: s.teamLogo || null,
        conference: s.conferenceName || '',
        division: s.divisionName || '',
      });
    }
    teams.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ league: 'nhl', teams });
  } catch (err) { next(err); }
});

module.exports = router;
