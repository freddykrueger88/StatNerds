const express = require('express');
const axios = require('axios');
const cache = require('../cache');
const router = express.Router();

// Poisson-Verteilung für Tore-Wahrscheinlichkeit
function poisson(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

// Berechne Heim/Unentschieden/Auswärts-Wahrscheinlichkeiten via Poisson
function poissonPrediction(homeAvg, awayAvg, maxGoals = 6) {
  let homeWin = 0, draw = 0, awayWin = 0;
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const p = poisson(h, homeAvg) * poisson(a, awayAvg);
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }
  const total = homeWin + draw + awayWin;
  return {
    home_win: Math.round((homeWin / total) * 100),
    draw:     Math.round((draw / total) * 100),
    away_win: Math.round((awayWin / total) * 100),
  };
}

// Lade historische Spiele aus mehreren Saisons
async function loadHistory(seasons = [2023, 2024, 2025]) {
  const cacheKey = 'pred_history_' + seasons.join('_');
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const allGames = [];
  for (const s of seasons) {
    try {
      const r = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/${s}`);
      allGames.push(...r.data.filter(g => g.matchIsFinished));
    } catch { /* Saison nicht verfügbar */ }
  }
  cache.set(cacheKey, allGames, 60 * 60 * 1000); // 1h
  return allGames;
}

// Gewinnwahrscheinlichkeit (Basis: Historische Daten + Poisson-Modell)
router.get('/', async (req, res) => {
  const { team1, team2, useXG } = req.query;
  if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 erforderlich' });

  const cacheKey = `pred_${team1}_${team2}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const games = await loadHistory([2023, 2024, 2025]);

    const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const t1 = normalize(team1);
    const t2 = normalize(team2);

    const matchTeam = (game, side, query) => {
      const name = normalize(game[side]?.teamName || game[side]?.shortName || '');
      const short = normalize(game[side]?.shortName || '');
      return name.includes(query) || short.includes(query) || query.includes(short);
    };

    // Alle abgeschlossenen Heimspiele von team1
    const homeGames1 = games.filter(g => matchTeam(g, 'team1', t1));
    // Alle abgeschlossenen Auswärtsspiele von team2
    const awayGames2 = games.filter(g => matchTeam(g, 'team2', t2));

    const avgGoals = (gList, side) => {
      if (!gList.length) return 1.4; // Liga-Durchschnitt als Fallback
      const total = gList.reduce((sum, g) => {
        const r = (g.matchResults || []).find(r => r.resultTypeID === 2) || g.matchResults?.[0];
        return sum + (r ? (side === 'home' ? r.pointsTeam1 : r.pointsTeam2) : 0);
      }, 0);
      return total / gList.length;
    };

    const homeAvgScored  = avgGoals(homeGames1, 'home');  // Heim-Tore team1
    const awayAvgConceded = avgGoals(awayGames2, 'home'); // Heim-Gegentore für team2 (= wie viele bekommt team2 auswärts)
    const homeAvgLambda = (homeAvgScored + awayAvgConceded) / 2;

    const awayAvgScored  = avgGoals(awayGames2, 'away');  // Auswärts-Tore team2
    const homeAvgConceded = avgGoals(homeGames1, 'away'); // Auswärts-Tore gegen team1
    const awayAvgLambda = (awayAvgScored + homeAvgConceded) / 2;

    // Direkte H2H-Spiele
    const h2h = games.filter(g =>
      (matchTeam(g, 'team1', t1) && matchTeam(g, 'team2', t2)) ||
      (matchTeam(g, 'team1', t2) && matchTeam(g, 'team2', t1))
    );

    const pred = poissonPrediction(homeAvgLambda, awayAvgLambda);

    // Erwartete Tore
    const result = {
      team1,
      team2,
      ...pred,
      expected_goals_home: Math.round(homeAvgLambda * 10) / 10,
      expected_goals_away: Math.round(awayAvgLambda * 10) / 10,
      h2h_games: h2h.length,
      sample_home: homeGames1.length,
      sample_away: awayGames2.length,
      model: 'Poisson (3 Saisons)',
      seasons: [2023, 2024, 2025],
    };

    cache.set(cacheKey, result, 30 * 60 * 1000); // 30 min
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Prediction mit xG (benötigt API-Football Key)
router.get('/xg', async (req, res) => {
  const { team1, team2, fixtureId } = req.query;
  const apiKey = req.headers['x-api-key'] || process.env.API_FOOTBALL_KEY;
  if (!apiKey) return res.status(401).json({ error: 'API-Football Key benötigt' });
  if (!fixtureId) return res.status(400).json({ error: 'fixtureId benötigt' });

  const cacheKey = `pred_xg_${fixtureId}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const r = await axios.get(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`, {
      headers: { 'x-apisports-key': apiKey }
    });
    const pred = r.data?.response?.[0];
    if (!pred) return res.status(404).json({ error: 'Keine Prediction verfügbar' });

    const result = {
      team1: pred.teams?.home?.name,
      team2: pred.teams?.away?.name,
      winner: pred.predictions?.winner?.name,
      advice: pred.predictions?.advice,
      home_win: parseFloat(pred.predictions?.percent?.home) || null,
      draw:     parseFloat(pred.predictions?.percent?.draw) || null,
      away_win: parseFloat(pred.predictions?.percent?.away) || null,
      home_form: pred.teams?.home?.last_5?.form,
      away_form: pred.teams?.away?.last_5?.form,
      home_avg_goals: pred.teams?.home?.last_5?.goals?.for?.average?.total,
      away_avg_goals: pred.teams?.away?.last_5?.goals?.for?.average?.total,
      model: 'API-Football ML',
      fixtureId,
    };
    cache.set(cacheKey, result, 60 * 60 * 1000); // 1h
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
