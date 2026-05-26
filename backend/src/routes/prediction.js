const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// ── Poisson-Verteilung ────────────────────────────────────────────────────────────
function poisson(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

function poissonPrediction(homeAvg, awayAvg, maxGoals = 6) {
  let homeWin = 0, draw = 0, awayWin = 0;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poisson(h, homeAvg) * poisson(a, awayAvg);
      if      (h > a) homeWin += p;
      else if (h === a) draw  += p;
      else              awayWin += p;
    }
  }
  const total = homeWin + draw + awayWin;
  return {
    home_win: Math.round((homeWin / total) * 100),
    draw:     Math.round((draw    / total) * 100),
    away_win: Math.round((awayWin / total) * 100),
  };
}

// ── Historische Daten laden – alle Saisons PARALLEL ─────────────────────────
async function loadHistory(seasons = [2023, 2024, 2025]) {
  const cacheKey = 'pred_history_' + seasons.join('_');
  const cached   = cache.get(cacheKey);
  if (cached) return cached;

  // War sequentiell (for-loop) – jetzt alle Saisons parallel
  const results = await Promise.all(
    seasons.map(s =>
      axios.get(`https://api.openligadb.de/getmatchdata/bl1/${s}`)
        .then(r => r.data.filter(g => g.matchIsFinished))
        .catch(() => [])
    )
  );
  const allGames = results.flat();
  cache.set(cacheKey, allGames, 60 * 60 * 1000);
  return allGames;
}

// ── GET /api/prediction?team1=X&team2=Y ────────────────────────────────────
router.get('/', async (req, res, next) => {
  const { team1, team2 } = req.query;
  if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 erforderlich' });

  const cacheKey = `pred_${team1}_${team2}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const games = await loadHistory();
    const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const t1 = normalize(team1);
    const t2 = normalize(team2);

    const matchTeam = (game, side, query) => {
      const name  = normalize(game[side]?.teamName  || '');
      const short = normalize(game[side]?.shortName || '');
      return name.includes(query) || short.includes(query) || query.includes(short);
    };

    const homeGames1 = games.filter(g => matchTeam(g, 'team1', t1));
    const awayGames2 = games.filter(g => matchTeam(g, 'team2', t2));

    const avgGoals = (list, side) => {
      if (!list.length) return 1.4;
      const total = list.reduce((sum, g) => {
        const r = (g.matchResults || []).find(r => r.resultTypeID === 2) || g.matchResults?.[0];
        return sum + (r ? (side === 'home' ? r.pointsTeam1 : r.pointsTeam2) : 0);
      }, 0);
      return total / list.length;
    };

    const homeAvgLambda = (avgGoals(homeGames1, 'home') + avgGoals(awayGames2, 'home')) / 2;
    const awayAvgLambda = (avgGoals(awayGames2, 'away') + avgGoals(homeGames1, 'away')) / 2;

    const h2h = games.filter(g =>
      (matchTeam(g, 'team1', t1) && matchTeam(g, 'team2', t2)) ||
      (matchTeam(g, 'team1', t2) && matchTeam(g, 'team2', t1))
    );

    const result = {
      team1, team2,
      ...poissonPrediction(homeAvgLambda, awayAvgLambda),
      expected_goals_home: Math.round(homeAvgLambda * 10) / 10,
      expected_goals_away: Math.round(awayAvgLambda * 10) / 10,
      h2h_games:    h2h.length,
      sample_home:  homeGames1.length,
      sample_away:  awayGames2.length,
      model:        'Poisson (3 Saisons)',
      seasons:      [2023, 2024, 2025],
    };
    cache.set(cacheKey, result, 30 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

// ── GET /api/prediction/xg?fixtureId=X ──────────────────────────────────────
router.get('/xg', async (req, res, next) => {
  const { fixtureId } = req.query;
  const apiKey = req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY;
  if (!apiKey)    return res.status(401).json({ error: 'API-Football Key benötigt' });
  if (!fixtureId) return res.status(400).json({ error: 'fixtureId benötigt' });

  const cacheKey = `pred_xg_${fixtureId}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const r = await axios.get(
      `https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`,
      { headers: { 'x-apisports-key': apiKey }, timeout: 8000 }
    );
    const pred = r.data?.response?.[0];
    if (!pred) return res.status(404).json({ error: 'Keine Prediction verfügbar' });

    const result = {
      team1:          pred.teams?.home?.name,
      team2:          pred.teams?.away?.name,
      winner:         pred.predictions?.winner?.name,
      advice:         pred.predictions?.advice,
      home_win:       parseFloat(pred.predictions?.percent?.home) || null,
      draw:           parseFloat(pred.predictions?.percent?.draw) || null,
      away_win:       parseFloat(pred.predictions?.percent?.away) || null,
      home_form:      pred.teams?.home?.last_5?.form,
      away_form:      pred.teams?.away?.last_5?.form,
      home_avg_goals: pred.teams?.home?.last_5?.goals?.for?.average?.total,
      away_avg_goals: pred.teams?.away?.last_5?.goals?.for?.average?.total,
      model:          'API-Football ML',
      fixtureId,
    };
    cache.set(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
