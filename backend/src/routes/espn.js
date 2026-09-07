'use strict';

const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// ── ESPN Public API (keyless) ─────────────────────────────────────────────────
// Basketball (NBA) + Tennis (ATP/WTA) + American Football (NFL): Scoreboards,
// Tabellen, Teams und Tennis-Rankings sind ohne Key verfügbar. Alle Antworten
// werden geccacht.
const BASE_SCORE   = 'https://site.api.espn.com/apis/site/v2/sports';
const BASE_WEB     = 'https://site.web.api.espn.com/apis/site/v2/sports';
const BASE_WEB2    = 'https://site.api.espn.com/apis/v2';

const ALLOWED = ['nba', 'atp', 'wta', 'nfl'];

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

// ── GET /api/espn/:league/current (nba | atp | wta | nfl) ───────────────────
router.get('/:league/current', validate, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key = `espn_cur_${league}`;
    if (league === 'nfl') {
      const raw = await espnGet(`${BASE_SCORE}/football/nfl/scoreboard`, key, 60 * 1000);
      const games = (raw.events || []).filter(e => e.competitions?.[0]).map(mapNflGame);
      return res.json({ league, week: raw.week?.number || null, season: raw.season?.year || null, games });
    }
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

// ── NFL-Mapping ──────────────────────────────────────────────────────────────
function mapNflGame(ev) {
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
  const st = comp.status?.type || {};
  const quarter = st.abbreviation && !['pre', 'POST', 'FINAL'].includes(st.abbreviation) ? st.abbreviation : '';
  return {
    id: ev.id,
    date: ev.date,
    status: st.description || 'Scheduled',
    detail: st.detail || '',
    quarter: st.period || 0,
    clock: comp.status?.displayClock || '',
    completed: st.state === 'post',
    live: st.state === 'in',
    venue: comp.venue?.fullName || '',
    spread: comp.odds?.[0]?.details || null,
    competitors: (comp.competitors || []).map(mk),
  };
}

// ── GET /api/espn/nfl/standings ──────────────────────────────────────────────
router.get('/nfl/standings', async (req, res, next) => {
  try {
    const raw = await espnGet(`${BASE_WEB2}/sports/football/nfl/standings`, 'espn_nfl_standings', 10 * 60 * 1000);
    const conferences = (raw.children || []).map(ch => {
      const zones = (ch.children || []).length ? ch.children.map(z => ({
        name: z.name || '',
        teams: (z.standings?.entries || []).map(mapStandingsTeam),
      })) : [];
      const teams = zones.length ? [] : (ch.standings?.entries || []).map(mapStandingsTeam);
      return { name: ch.name || '', zones, teams };
    });
    res.json({ league: 'nfl', conferences });
  } catch (err) { next(err); }
});

function mapStandingsTeam(e) {
  const stats = {};
  (e.stats || []).forEach(s => { if (s.value !== undefined) stats[s.name] = s.value; });
  const t = e.team || {};
  return {
    id: t.id,
    name: t.displayName,
    abbrev: t.abbreviation,
    logo: (t.logos || []).find(l => (l.rel || []).includes('full') && (l.rel || []).includes('default'))?.href || null,
    wins: stats.wins || 0,
    losses: stats.losses || 0,
    ties: stats.ties || 0,
    pct: stats.winPercent || 0,
    gb: stats.gamesBehind ?? stats.gamesAhead ?? 0,
    streak: stats.streak !== undefined ? String(stats.streak) : '',
    pointsFor: stats.pointsFor ?? stats.pointsforth ?? 0,
    pointsAgainst: stats.pointsAgainst ?? 0,
    diff: (stats.differential ?? stats.pointDifferential ?? (stats.pointsFor - stats.pointsAgainst)) || 0,
    playoffSeed: stats.playoffSeed ?? 0,
    division: stats.DIV || stats['vs. Div.'] || '',
    conference: stats.CONF || stats['vs. Conf.'] || '',
  };
}

// ── GET /api/espn/nfl/teams ──────────────────────────────────────────────────
router.get('/nfl/teams', async (req, res, next) => {
    try {
    const raw = await espnGet(`${BASE_WEB}/football/nfl/teams`, 'espn_nfl_teams', 60 * 60 * 1000);
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
    res.json({ league: 'nfl', teams });
  } catch (err) { next(err); }
});

// ── GET /api/espn/nfl/leaders?category=passingYards&limit=20 ─────────────────
// Keyless-Stat-Leaderboard der NFL (statistics-Kategorien). Jeder Leader wird
// per $ref auflöst (Name, Headshot, Team). Antworten werden geccacht.
const NFL_LEADER_CATS = {
  passingYards: 'passingYards', passingTouchdowns: 'passingTouchdowns', completions: 'completions',
  rushingYards: 'rushingYards', rushingTouchdowns: 'rushingTouchdowns',
  receptions: 'receptions',
  sacks: 'sacks', interceptions: 'interceptions', totalPoints: 'totalPoints', totalTouchdowns: 'totalTouchdowns',
};
const LEADER_CATEGORY_LABELS = {
  passingYards: 'Passing Yards', passingTouchdowns: 'Passing TDs', completions: 'Completions',
  rushingYards: 'Rushing Yards', rushingTouchdowns: 'Rushing TDs',
  receptions: 'Receptions', sacks: 'Sacks', interceptions: 'Interceptions',
  totalPoints: 'Punkte', totalTouchdowns: 'Touchdowns',
};

router.get('/nfl/leaders', async (req, res, next) => {
  try {
    const category = NFL_LEADER_CATS[req.query.category] || 'passingYards';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const def = await espnGet('https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/leaders', 'espn_nfl_leader_def', 24 * 60 * 60 * 1000);
    const cat = (def.categories || []).find(c => c.name === category);
    if (!cat) return res.status(404).json({ error: `Kategorie '${category}' nicht verfügbar` });
    const leaders = (cat.leaders || []).slice(0, limit);
    const out = await Promise.all(leaders.map(async (l, i) => {
      let player = { name: '', headshot: null, teamId: null, team: '' };
      try {
        const r = await axios.get(l.athlete.$ref || l.athlete, { timeout: 10000 });
        const a = r.data || {};
        player.name = a.displayName || a.fullName || '';
        player.headshot = a.headshot?.href || null;
        const teamRef = a.team?.[0]?.$ref || a.team?.$ref;
        if (teamRef) {
          const t = (await axios.get(teamRef, { timeout: 10000 })).data || {};
          player.teamId = t.id || null;
          player.team = t.abbreviation || t.displayName || '';
        }
      } catch { /* Einzelleader-Resolven darf nicht die Antwort killen */ }
      return { rank: i + 1, value: l.displayValue !== undefined ? l.displayValue : l.value, player };
    }));
    res.json({
      league: 'nfl',
      category: req.query.category || category,
      label: LEADER_CATEGORY_LABELS[req.query.category] || LEADER_CATEGORY_LABELS[category] || category,
      type: 'career',
      leaders: out,
    });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.mapNbaGame = mapNbaGame;
module.exports.mapTennisTournament = mapTennisTournament;
module.exports.findTennisPlayer = findTennisPlayer;
module.exports.mapNflGame = mapNflGame;
