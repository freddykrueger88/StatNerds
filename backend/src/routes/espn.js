'use strict';

const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// ── ESPN Public API (keyless) ─────────────────────────────────────────────────
// Basketball (NBA) + Tennis (ATP/WTA): Scoreboards, Tabellen, Teams und
// Tennis-Rankings sind ohne Key verfügbar. Alle Antworten werden geccacht.
const BASE_SCORE   = 'https://site.api.espn.com/apis/site/v2/sports';
const BASE_WEB     = 'https://site.web.api.espn.com/apis/site/v2/sports';
const BASE_WEB2    = 'https://site.api.espn.com/apis/v2';

const ALLOWED = ['nba', 'atp', 'wta'];

function validate(req, res, next) {
  if (!ALLOWED.includes(req.params.league)) {
    return res.status(400).json({ error: `Liga '${req.params.league}' nicht unterstützt. Erlaubt: ${ALLOWED.join(', ')}` });
  }
  next();
}

const T = 30 * 1000; // axios timeout
// Kein custom User-Agent: ESPN blockiert fremde UAs bei manchen Endpoints
// (z.B. NBA-Standings) mit leerer Antwort. Axios-Default nutzen.
const opts = { timeout: 10000 };

async function espnGet(url, cacheKey, ttl) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const r = await axios.get(url, { ...opts, validateStatus: st => st < 500 });
  if (![200, 304].includes(r.status) || typeof r.data !== 'object' || r.data === null || (r.data.code && ![200, 304].includes(r.data.code))) {
    const err = new Error(`ESPN '${url}' fehlgeschlagen (Status ${r.status})`);
    err.status = 502;
    throw err;
  }
  cache.set(cacheKey, r.data, ttl);
  return r.data;
}

// ── NBA-BoxScore-Mapping ─────────────────────────────────────────────────────
function mapNbaGame(ev) {
  const comp = ev.competitions?.[0];
  if (!comp) return null;
  const mk = co => {
    const t = co.team || {};
    return {
      homeAway: co.homeAway,
      team: t.abbreviation || t.displayName,
      name: t.displayName,
      score: co.score,
      record: co.record || '',
      logo: (t.logos || []).find(l => (l.rel || []).includes('full') && (l.rel || []).includes('default'))?.href || null,
    };
  };
  return {
    id: ev.id,
    date: ev.date,
    status: comp.status?.type?.description || 'Scheduled',
    detail: comp.status?.type?.detail || '',
    period: comp.status?.displayClock || '',
    completed: comp.status?.type?.state === 'post',
    live: comp.status?.type?.state === 'in',
    venue: comp.venue?.fullName || '',
    competitors: (comp.competitors || []).map(mk),
  };
}

// ── Tennis-Mapping ───────────────────────────────────────────────────────────
function mapTennisTournament(ev) {
  const matches = [];
  for (const g of ev.groupings || []) {
    for (const c of g.competitions || []) {
      const comp = c.competition || c;
      const participants = (comp.competitors || []).map(co => ({
        homeAway: co.homeAway,
        name: co.athlete?.displayName || co.displayName || '',
        seed: co.athlete?.seed || co.seed || null,
        winner: !!co.winner,
        sets: (co.linescores || []).map(l => Math.round(l.value)),
      }));
      matches.push({
        id: comp.id,
        status: comp.status?.type?.description || '',
        completed: comp.status?.type?.state === 'post',
        live: comp.status?.type?.state === 'in',
        note: comp.notes?.[0]?.text || '',
        venue: comp.venue?.fullName || '',
        competitors: participants,
      });
    }
  }
  return {
    id: ev.id,
    name: ev.name,
    shortName: ev.shortName,
    start: ev.date,
    end: ev.endDate,
    major: !!ev.major,
    matches,
  };
}

// ── GET /api/espn/nba/current ─────────────────────────────────────────────────
router.get('/:league/current', validate, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key = `espn_cur_${league}`;
    const raw = await espnGet(`${BASE_SCORE}/${league === 'nba' ? 'basketball' : 'tennis'}/${league}/scoreboard`, key, 60 * 1000);
    const games = (raw.events || []).map(league === 'nba' ? mapNbaGame : mapTennisTournament).filter(Boolean);
    res.json({ league, games, date: raw.day?.date || null });
  } catch (err) { next(err); }
});

// ── GET /api/espn/nba/standings ───────────────────────────────────────────────
router.get('/nba/standings', async (req, res, next) => {
  try {
    const raw = await espnGet(`${BASE_WEB2}/sports/basketball/nba/standings`, 'espn_nba_standings', 10 * 60 * 1000);
    const conferences = (raw.children || []).map(ch => ({
      name: ch.name || '',
      teams: (ch.standings?.entries || []).map(e => {
        const stats = {};
        (e.stats || []).forEach(s => { stats[s.name] = s.value; });
        const t = e.team || {};
        return {
          id: t.id,
          name: t.displayName,
          abbrev: t.abbreviation,
          logo: (t.logos || []).find(l => (l.rel || []).includes('full') && (l.rel || []).includes('default'))?.href || null,
          wins: stats.wins || stats.overall?.split?.('-')?.[0] || 0,
          losses: stats.losses || 0,
          pct: stats.winPercent || 0,
          gb: stats.gamesBehind ?? stats.gamesAhead ?? 0,
          streak: stats.streak !== undefined ? String(stats.streak) : '',
          home: stats.Home || '',
          away: stats.Road || '',
          last10: stats['Last Ten Games'] || '',
          diff: stats.differential || 0,
          ppg: stats.avgPointsFor || 0,
          oppg: stats.avgPointsAgainst || 0,
        };
      }),
    }));
    res.json({ league: 'nba', conferences });
  } catch (err) { next(err); }
});

// ── GET /api/espn/nba/teams ───────────────────────────────────────────────────
router.get('/nba/teams', async (req, res, next) => {
  try {
    const raw = await espnGet(`${BASE_WEB}/basketball/nba/teams`, 'espn_nba_teams', 60 * 60 * 1000);
    const teams = raw?.sports?.[0]?.leagues?.[0]?.teams?.map(x => {
      const t = x.team || {};
      return {
        id: t.id,
        name: t.displayName,
        short: t.abbreviation,
        color: t.color || '',
        alternateColor: t.alternateColor || '',
        logo: (t.logos || []).find(l => (l.rel || []).includes('full') && (l.rel || []).includes('default'))?.href || null,
      };
    }) || [];
    res.json({ league: 'nba', teams });
  } catch (err) { next(err); }
});

// ── GET /api/espn/:league/rankings (atp | wta) ───────────────────────────────
const SEASON_YEAR = () => new Date().getFullYear();

router.get('/:league/rankings', validate, async (req, res, next) => {
  const { league } = req.params;
  try {
    const raw = await espnGet(`${BASE_WEB}/tennis/${league}/rankings?season=${SEASON_YEAR()}`, `espn_rank_${league}`, 60 * 60 * 1000);
    const ranks = (raw.rankings?.[0]?.ranks || []).map((r, i) => {
      const a = r.athlete || {};
      return {
        rank: i + 1,
        current: r.current,
        previous: r.previous,
        trend: r.trend,
        points: r.points,
        player: {
          id: a.id,
          name: a.displayName || a.shortname,
          age: a.age,
          country: a.citizenshipCountry || '',
          flag: a.flag || null,
          headshot: a.headshot || null,
          birthPlace: a.birthPlace?.summary || '',
        },
      };
    });
    res.json({ league, season: SEASON_YEAR(), ranks });
  } catch (err) { next(err); }
});

// ── GET /api/espn/:league/player/:id (atp | wta) ─────────────────────────────
// Ranking-Profil aus der Rangliste + aktuelle Turnier-Spiele aus dem Scoreboard.
async function findTennisPlayer(league, id) {
  const [rankRaw, sb] = await Promise.all([
    espnGet(`${BASE_WEB}/tennis/${league}/rankings?season=${SEASON_YEAR()}`, `espn_rank_${league}`, 60 * 60 * 1000),
    espnGet(`${BASE_SCORE}/tennis/${league}/scoreboard`, `espn_cur_${league}`, 60 * 1000).catch(() => ({ events: [] })),
  ]);
  const entries = rankRaw.rankings?.[0]?.ranks || [];
  const idx = entries.findIndex(r => String(r.athlete?.id) === String(id));
  const e = entries[idx];
  if (!e) return null;
  const a = e.athlete || {};
  const profile = {
    rank: e.current ?? idx + 1,
    previous: e.previous,
    trend: e.trend,
    points: e.points,
    player: {
      id: a.id,
      name: a.displayName || a.shortname,
      age: a.age,
      country: a.citizenshipCountry || '',
      flag: a.flag || null,
      headshot: a.headshot || null,
      birthPlace: a.birthPlace?.summary || '',
    },
  };
  const matches = [];
  for (const ev of sb.events || []) {
    for (const g of ev.groupings || []) {
      for (const c of g.competitions || []) {
        const comp = c.competition || c;
        const involved = (comp.competitors || []).filter(co => String(co.athlete?.id) === String(id));
        if (involved.length) {
          matches.push({
            tournament: ev.name,
            status: comp.status?.type?.description || '',
            venue: comp.venue?.fullName || '',
            note: comp.notes?.[0]?.text || '',
            competitors: (comp.competitors || []).map(co => ({
              name: co.athlete?.displayName || '',
              winner: !!co.winner,
              sets: (co.linescores || []).map(l => Math.round(l.value)),
            })),
          });
        }
      }
    }
  }
  profile.matches = matches;
  return profile;
}

router.get('/:league/player/:id', validate, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key = `espn_tennis_player_${league}_${req.params.id}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const profile = await findTennisPlayer(league, req.params.id);
    if (!profile) return res.status(404).json({ error: 'Spieler nicht in der Rangliste gefunden' });
    cache.set(key, profile, 15 * 60 * 1000);
    res.json(profile);
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.mapNbaGame = mapNbaGame;
module.exports.mapTennisTournament = mapTennisTournament;
module.exports.findTennisPlayer = findTennisPlayer;
