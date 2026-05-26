const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// Erlaubte Ligen (Whitelist gegen Path-Traversal)
const ALLOWED_LEAGUES = ['bl1', 'bl2'];
const SEASON = process.env.BL_SEASON || String(new Date().getFullYear());

// ── Rohdaten aller bisherigen Spieltage laden (gecacht per Liga) ──────────
async function loadAllMatchdays(league = 'bl1') {
  const cacheKey = `all_matchdays_raw_${league}`;
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  const currentRes      = await axios.get(`https://api.openligadb.de/getcurrentgroup/${league}`);
  const currentMatchday = currentRes.data?.groupOrderID || 34;
  const matchdays       = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);

  const responses = await Promise.all(
    matchdays.map(md =>
      axios.get(`https://api.openligadb.de/getmatchdata/${league}/${SEASON}/${md}`)
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
    const r = await axios.get(`https://api.openligadb.de/getmatchdata/${league}`);
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
    const r = await axios.get(`https://api.openligadb.de/getmatchdata/${league}/${SEASON}/${md}`);
    cache.set(key, r.data, 5 * 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

// ── GET /api/games/:league/table ─────────────────────────────────────────
router.get('/:league/table', validateLeague, async (req, res, next) => {
  const { league } = req.params;
  try {
    const key    = `table_${league}`;
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const r = await axios.get(`https://api.openligadb.de/getbltable/${league}/${SEASON}`);
    cache.set(key, r.data, 10 * 60 * 1000);
    res.json(r.data);
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

// ── GET /api/games/bl1/h2h?team1=X&team2=Y (nur bl1, historische Daten) ──────
router.get('/bl1/h2h', async (req, res, next) => {
  try {
    const { team1, team2 } = req.query;
    if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 benötigt' });
    const cacheKey = `h2h_${team1.toLowerCase()}_${team2.toLowerCase()}`;
    const cached   = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const q1 = team1.toLowerCase();
    const q2 = team2.toLowerCase();
    const allData = await loadAllMatchdays('bl1');
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
    const r = await axios.get(`https://api.openligadb.de/getavailablegroups/${league}/${SEASON}`);
    cache.set(key, r.data, 60 * 60 * 1000);
    res.json(r.data);
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.loadAllMatchdays = loadAllMatchdays;
