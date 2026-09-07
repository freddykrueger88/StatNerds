const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// Erlaubte Ligen (Whitelist gegen Path-Traversal)
const ALLOWED_LEAGUES = ['bl1', 'bl2', 'fbl1', 'bbl'];
const SEASON = process.env.BL_SEASON || String(new Date().getFullYear());

// OpenLigaDB-Shortcuts: interne Liga-ID → OpenLigaDB-Bezeichner.
// Hinweis: 'bbl' (Basketball-Bundesliga) hat bei OpenLigaDB nur Daten bis 2018
// (Provider-Limitierung) – die Saison-Auflösung fällt bis zur letzten Saison zurück.
const OLDB_SHORTCUTS = { bbl: 'BBBL1' };

// ── Liga-Saison auflösen (gecacht pro Liga) ─────────────────────────────────
// Nicht jede Liga hat die laufende Saison schon bei OpenLigaDB (z.B. die
// Frauen-Bundesliga startet später). Fallback: jüngste Saison mit verfügbaren
// Spieltagen. Wird automatisch dauerhaft gültig, sobald OpenLigaDB die neue
// Saison bereitstellt.
const seasonCache = new Map(); // league -> { season, ts }
const SEASON_TTL = 6 * 60 * 60 * 1000; // 6h

function odb(league) {
  return OLDB_SHORTCUTS[league] || league;
}

async function resolveSeason(league) {
  const hit = seasonCache.get(league);
  if (hit && Date.now() - hit.ts < SEASON_TTL) return hit.season;
  // 'bbl' hat seit Jahren keine laufende Saison mehr → weit zurück suchen.
  const lookback = league === 'bbl' ? 12 : 2;
  const base = Number(SEASON);
  let found = null;
  for (let off = 0; off <= lookback; off++) {
    const candidate = base - off;
    const r = await axios.get(`https://api.openligadb.de/getavailablegroups/${odb(league)}/${candidate}`, { validateStatus: st => st < 500, timeout: 5000 });
    if (r.status === 200 && Array.isArray(r.data) && r.data.length > 0) { found = String(candidate); break; }
  }
  if (found) {
    seasonCache.set(league, { season: found, ts: Date.now() });
    return found;
  }
  // Kein Jahr mit Daten gefunden (z.B. Provider-Rate-Limit beim Saisonstart):
  // letzte bekannte Saison weiterverwenden, sonst kurzfristig auf SEASON ausweichen.
  // Die kurze TTL (2 min) verhindert, dass eine nur geratete Saison 6h hängt.
  const ttlStall = Date.now() - SEASON_TTL + 2 * 60 * 1000;
  const fallback = hit?.season || String(SEASON);
  seasonCache.set(league, { season: fallback, ts: ttlStall });
  return fallback;
}

// ── Alle Spieltage EINER Saison laden (gecacht per Liga+Saison) ────────────
async function loadSeasonMatchdays(league, season) {
  const cacheKey = `md_season_${league}_${season}`;
  const cached   = cache.get(cacheKey);
  if (cached) return cached;
  const groups = await axios.get(`https://api.openligadb.de/getavailablegroups/${odb(league)}/${season}`, { validateStatus: st => st < 500, timeout: 5000 }).catch(() => null);
  const ids = (Array.isArray(groups?.data) ? groups.data : []).map(g => Number(g.groupOrderID)).filter(n => n > 0);
  if (!ids.length) return [];
  const responses = await Promise.all(
    ids.map(md => axios.get(`https://api.openligadb.de/getmatchdata/${odb(league)}/${season}/${md}`).then(r => r.data).catch(() => []))
  );
  const all = responses.flat();
  cache.set(cacheKey, all, 20 * 60 * 1000);
  return all;
}

// ── Rohdaten aller bisherigen Spieltage laden (gecacht per Liga) ──────────
async function loadAllMatchdays(league = 'bl1') {
  const cacheKey = `all_matchdays_raw_${league}`;
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const season = await resolveSeason(league);

  // Aktueller Spieltag: bevorzugt der "live"-Spieltag, sonst der jüngste
  // verfügbare der aufgelösten Saison (deckt Ligen ohne laufende Saison ab).
  let currentMatchday = 0;
  const cur = await axios.get(`https://api.openligadb.de/getcurrentgroup/${odb(league)}`, { validateStatus: st => st < 500, timeout: 5000 }).catch(() => null);
  if (cur?.data?.groupOrderID) currentMatchday = Number(cur.data.groupOrderID);
  if (!currentMatchday) {
    const groups = await axios.get(`https://api.openligadb.de/getavailablegroups/${odb(league)}/${season}`, { validateStatus: st => st < 500, timeout: 5000 }).catch(() => null);
    const ids = (Array.isArray(groups?.data) ? groups.data : []).map(g => Number(g.groupOrderID)).filter(n => n > 0);
    if (ids.length) currentMatchday = Math.max(...ids);
  }
  if (!currentMatchday) currentMatchday = 34;

  const matchdays = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);

  const responses = await Promise.all(
    matchdays.map(md =>
      axios.get(`https://api.openligadb.de/getmatchdata/${odb(league)}/${season}/${md}`)
        .then(r => r.data)
        .catch(() => [])
    )
  );
  const all = responses.flat();
  cache.set(cacheKey, all, 20 * 60 * 1000);
  return all;
}

// ── Scorer-Map ───────────────────────────────────────────────────
function buildScorerMap(matches) {
  const scorerMap = {};
  matches.forEach(match => {
    (match.goals || []).forEach(goal => {
      if (!goal.goalGetterName?.trim()) return;
      const name = goal.goalGetterName;
      const team = match.team1?.shortName || match.team1?.teamName;
      if (!scorerMap[name]) scorerMap[name] = { name, team, goals: 0, penalties: 0, ownGoals: 0 };
      if (goal.isOwnGoal) scorerMap[name].ownGoals++;
      else { scorerMap[name].goals++; if (goal.isPenalty) scorerMap[name].penalties++; }
    });
  });
  return scorerMap;
}

// ── Middleware: Liga validieren ───────────────────────────────────────
function validateLeague(req, res, next) {
  const league = req.params.league;
  if (!ALLOWED_LEAGUES.includes(league)) {
    return res.status(400).json({ error: `Liga '${league}' nicht unterstützt. Erlaubt: ${ALLOWED_LEAGUES.join(', ')}` });
  }
  next();
}

// ── GET /api/games/:league/current ──────────────────────────────────────
router.get('/:league/current', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key    = `current_${league}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const r = await axios.get(`https://api.openligadb.de/getmatchdata/${odb(league)}`);
    cache.set(key, r.data, 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/:matchday ────────────────────────────────────
router.get('/:league/:matchday(\\d+)', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  const md = parseInt(req.params.matchday);
  if (md < 1 || md > 34) return res.status(400).json({ error: 'Spieltag muss zwischen 1 und 34 liegen' });
  try {
    const key    = `md_${league}_${md}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const season = await resolveSeason(league);
    const r = await axios.get(`https://api.openligadb.de/getmatchdata/${odb(league)}/${season}/${md}`);
    cache.set(key, r.data, 5 * 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/table[?season=YYYY] ──────────────────────────────
// Optional: historische Saison über ?season= anfragen (für Issue #21 Saisonvergleich).
router.get('/:league/table', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  const { season } = req.query;
  try {
    const useSeason = season && /^\d{4}$/.test(season) ? season : await resolveSeason(league);
    const key    = `table_${league}_${useSeason}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const r = await axios.get(`https://api.openligadb.de/getbltable/${odb(league)}/${useSeason}`);
    cache.set(key, r.data, 10 * 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/seasons ──────────────────────────────────────────
// Verfügbare Saisons einer Liga bei OpenLigaDB (getavailablegroups pro Jahr).
// Für Issue #21 (Saisonvergleich): zurückliegende Jahre mit Daten auflisten.
router.get('/:league/seasons', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key    = `seasons_${league}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const lookback = league === 'bbl' ? 12 : 9;
    const base = Number(SEASON);
    const found = [];
    for (let off = 0; off <= lookback; off++) {
      const y = base - off;
      const r = await axios.get(`https://api.openligadb.de/getavailablegroups/${odb(league)}/${y}`, { validateStatus: st => st < 500, timeout: 5000 });
      if (r.status === 200 && Array.isArray(r.data) && r.data.length > 0) found.push(y);
    }
    const seasons = found.sort((a, b) => b - a);
    cache.set(key, { league, seasons }, 6 * 60 * 60 * 1000);
    res.json({ league, seasons });
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/teamwindow?team=X ────────────────────────────────
// Nächstes & letztes Spiel eines Vereins aus der laufenden Saison (Issue #33 Dashboard).
router.get('/:league/teamwindow', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  const team = req.query.team;
  if (!team) return res.status(400).json({ error: 'team benötigt (z.B. ?team=Bayern)' });
  try {
    const cacheKey = `teamwindow_${league}_${team.toLowerCase()}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const all = await loadAllMatchdays(league);
    const q = team.toLowerCase();
    const isTeam = (m, n) => {
      const t = m[`team${n}`];
      return `${t?.teamName || t?.shortName || ''}`.toLowerCase().includes(q);
    };
    const mine = all.filter(m => isTeam(m, 1) || isTeam(m, 2));
    const brief = m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      return {
        date: m.matchDateTime,
        home: m.team1?.teamName || m.team1?.shortName,
        away: m.team2?.teamName || m.team2?.shortName,
        score: final ? `${final.pointsTeam1}:${final.pointsTeam2}` : null,
        isHome: isTeam(m, 1),
        finished: !!m.matchIsFinished,
      };
    };
    const finished = mine.filter(m => m.matchIsFinished).sort((a, b) => b.matchDateTime.localeCompare(a.matchDateTime));
    const upcoming = mine.filter(m => !m.matchIsFinished).sort((a, b) => a.matchDateTime.localeCompare(b.matchDateTime));
    cache.set(cacheKey, {
      last: finished[0] ? brief(finished[0]) : null,
      next: upcoming[0] ? brief(upcoming[0]) : null,
    }, 5 * 60 * 1000);
    res.json({
      last: finished[0] ? brief(finished[0]) : null,
      next: upcoming[0] ? brief(upcoming[0]) : null,
    });
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/teamform?team=X ─────────────────────────────────
// Formkurve der letzten 10 Pflichtspiele eines Vereins (Issue #37): jedes Spiel
// als { date, opponent, score, isHome, goalsFor, goalsAgainst, points, result }
// chronologisch aufsteigend. Lässt sich mit den Tabellen-Rohwerten in einen
// SVG-Kurvenchart (kumulierte Punkte + Tore) wandeln. xG fehlt ohne
// API-Football-Key – das Frontend zeigt dann nur Punkte/Tore an.
router.get('/:league/teamform', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  const team = req.query.team;
  if (!team) return res.status(400).json({ error: 'team benötigt (z.B. ?team=Bayern)' });
  try {
    const cacheKey = `teamform_${league}_${team.toLowerCase()}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const all = await loadAllMatchdays(league);
    const games = module.exports.buildTeamForm(league, all, team);
    cache.set(cacheKey, { team, league, games }, 5 * 60 * 1000);
    res.json({ team, league, games });
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/scorers ───────────────────────────────────────
router.get('/:league/scorers', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key    = `scorers_${league}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const all    = await loadAllMatchdays(league);
    const map    = buildScorerMap(all);
    const sorted = Object.values(map).filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 30);
    cache.set(key, sorted, 15 * 60 * 1000);
    res.json(sorted);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/assists ───────────────────────────────────────
router.get('/:league/assists', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key    = `assists_${league}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const all       = await loadAllMatchdays(league);
    const assistMap = {};
    all.forEach(match => {
      (match.goals || []).forEach(goal => {
        if (!goal.goalGetterName?.trim() || goal.isOwnGoal) return;
        const assistName = goal.goalGetterName2?.trim();
        if (!assistName) return;
        const team = match.team1?.shortName || match.team1?.teamName;
        if (!assistMap[assistName]) assistMap[assistName] = { name: assistName, team, assists: 0 };
        assistMap[assistName].assists++;
      });
    });
    const sorted = Object.values(assistMap).filter(a => a.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 30);
    cache.set(key, sorted, 15 * 60 * 1000);
    res.json(sorted);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/h2h?team1=X&team2=Y (historische Daten) ──────
router.get('/:league/h2h', validateLeague, async (req, res, next) => {
  try {
    const { league } = req.params;
    const { team1, team2 } = req.query;
    if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 benötigt' });
    const cacheKey = `h2h_${league}_${team1.toLowerCase()}_${team2.toLowerCase()}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const q1 = team1.toLowerCase();
    const q2 = team2.toLowerCase();
    const allData = await loadAllMatchdays(league);
    const relevant = allData.filter(m => {
      const t1 = (m.team1?.shortName || m.team1?.teamName || '').toLowerCase();
      const t2 = (m.team2?.shortName || m.team2?.teamName || '').toLowerCase();
      return (t1.includes(q1) && t2.includes(q2)) || (t1.includes(q2) && t2.includes(q1));
    });
    const result = relevant.map(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      return {
        date: m.matchDateTime,
        home: m.team1?.shortName || m.team1?.teamName,
        away: m.team2?.shortName || m.team2?.teamName,
        score: final ? `${final.pointsTeam1}:${final.pointsTeam2}` : null,
        finished: m.matchIsFinished,
      };
    });
    cache.set(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/matchdays ──────────────────────────────────────
router.get('/:league/matchdays', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key    = `matchdays_${league}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const season = await resolveSeason(league);
    const r = await axios.get(`https://api.openligadb.de/getavailablegroups/${odb(league)}/${season}`);
    cache.set(key, r.data, 60 * 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/compare?team1=X&team2=Y ──────────────────────────
// Für Issue #10 (Vereins-Vergleichsansicht): berechnet pro Verein Tabellenwerte,
// Form (letzte 10 Pflichtspiele) und die H2H-Historie aus allen Spieltagen.
router.get('/:league/compare', validateLeague, async (req, res, next) => {
  try {
    const { league } = req.params;
    const { team1, team2 } = req.query;
    if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 benötigt (z.B. ?team1=Bayern&team2=Dortmund)' });
    const cacheKey = `compare_${league}_${team1.toLowerCase()}_${team2.toLowerCase()}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const all = await loadAllMatchdays(league);

    // Statistik basiert auf der laufenden (aufgelösten) Saison, H2H erstreckt
    // sich über mehrere Saisons (Issue #10: „H2H der letzten Saisons“).
    const season = await resolveSeason(league);
    let h2h = [];
    for (const y of [Number(season), Number(season) - 1, Number(season) - 2]) {
      if (y < 1990) continue;
      const seasonData = await loadSeasonMatchdays(league, String(y));
      const q1 = team1.toLowerCase(); const q2 = team2.toLowerCase();
      seasonData.filter(m => {
        const a = (m.team1?.teamName || m.team1?.shortName || '').toLowerCase();
        const b = (m.team2?.teamName || m.team2?.shortName || '').toLowerCase();
        return (a.includes(q1) && b.includes(q2)) || (a.includes(q2) && b.includes(q1));
      }).forEach(m => {
        const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
        h2h.push({
          date: m.matchDateTime,
          home: m.team1?.teamName || m.team1?.shortName,
          away: m.team2?.teamName || m.team2?.shortName,
          score: final ? `${final.pointsTeam1}:${final.pointsTeam2}` : null,
          finished: !!m.matchIsFinished,
        });
      });
    }
    h2h.sort((a, b) => a.date.localeCompare(b.date));

    // Standings aus Endergebnissen bauen (Freilose/Siege → 3 Punkte; BBL nutzt
    // nur Sieg/Niederlage, dort greift die variable Punktevergabe nicht).
    const R3 = league === 'bbl' ? { win: 1, draw: 0 } : { win: 3, draw: 1 };
    const teams = {};
    const find = name => {
      const key = (name || '').toLowerCase().trim();
      if (!teams[key]) teams[key] = { name, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, results: [] };
      return teams[key];
    };
    all.forEach(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      const t1 = find(m.team1?.teamName || m.team1?.shortName);
      const t2 = find(m.team2?.teamName || m.team2?.shortName);
      const g1 = final ? Number(final.pointsTeam1) : 0;
      const g2 = final ? Number(final.pointsTeam2) : 0;
      t1.played++; t2.played++;
      t1.goalsFor += g1; t1.goalsAgainst += g2;
      t2.goalsFor += g2; t2.goalsAgainst += g1;
      if (g2 === 0 && final) t1.cleanSheets++;
      if (g1 === 0 && final) t2.cleanSheets++;
      if (g1 > g2) { t1.wins++; t2.losses++; t1.results.push('S'); t2.results.push('N'); }
      else if (g2 > g1) { t2.wins++; t1.losses++; t2.results.push('S'); t1.results.push('N'); }
      else { t1.draws++; t2.draws++; t1.results.push('U'); t2.results.push('U'); }
    });

    // Punkte + Sortierung → Position
    const allTeams = Object.values(teams).filter(t => t.played > 0);
    allTeams.forEach(t => {
      t.points = t.wins * R3.win + t.draws * R3.draw;
      t.goalDiff = t.goalsFor - t.goalsAgainst;
      t.avgGoals = t.played ? Math.round((t.goalsFor / t.played) * 100) / 100 : 0;
      t.form = t.results.slice(-10).join('·');
    });
    allTeams.sort((a, b) => (b.points - a.points) || (b.goalDiff - a.goalDiff) || (b.goalsFor - a.goalsFor));
    const positions = new Map(allTeams.map((t, i) => [t.name.toLowerCase(), i + 1]));

    const summarize = query => {
      const t = teams[query.toLowerCase()];
      if (!t) return null;
      return {
        name: t.name,
        position: positions.get(t.name.toLowerCase()) || null,
        played: t.played, wins: t.wins, draws: t.draws, losses: t.losses,
        points: t.points, goalsFor: t.goalsFor, goalsAgainst: t.goalsAgainst,
        goalDiff: t.goalDiff, cleanSheets: t.cleanSheets, avgGoals: t.avgGoals,
        form: t.form,
      };
    };

    // param kann auch auf den Gegner matchen → echten Vereinsnamen auflösen
    const resolveName = query => {
      for (const t of allTeams) {
        const name = (t.name || '').toLowerCase();
        if (name.includes(query.toLowerCase())) return t.name;
      }
      return null;
    };
    const n1 = resolveName(team1) || team1;
    const n2 = resolveName(team2) || team2;
    const result = { league, team1: summarize(n1), team2: summarize(n2), h2h };
    cache.set(cacheKey, result, 30 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.loadAllMatchdays = loadAllMatchdays;
module.exports.resolveSeason = resolveSeason;
module.exports.buildTeamForm = (league, all, team) => {
  // Gemeinsame Logik für Tests (Issue #37): liefert die Formrechnung zu einem
  // Team ohne eigentlichen HTTP-/Cache-Zugriff.
  const q = team.toLowerCase();
  const isTeam = (m, n) => {
    const t = m[`team${n}`];
    return `${t?.teamName || t?.shortName || ''}`.toLowerCase().includes(q);
  };
  const R3 = league === 'bbl' ? { win: 1, draw: 0 } : { win: 3, draw: 1 };
  return all
    .filter(m => m.matchIsFinished && (isTeam(m, 1) || isTeam(m, 2)))
    .map(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      const isHome = isTeam(m, 1);
      const gf = final ? Number(isHome ? final.pointsTeam1 : final.pointsTeam2) : 0;
      const ga = final ? Number(isHome ? final.pointsTeam2 : final.pointsTeam1) : 0;
      let points = R3.draw, result = 'U';
      if (gf > ga) { points = R3.win; result = 'S'; }
      else if (gf < ga) { points = 0; result = 'N'; }
      return {
        date: m.matchDateTime,
        opponent: (isHome ? m.team2?.teamName : m.team1?.teamName) || (isHome ? m.team2?.shortName : m.team1?.shortName),
        score: `${gf}:${ga}`,
        isHome,
        goalsFor: gf,
        goalsAgainst: ga,
        points,
        result,
        finished: true,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);
};
