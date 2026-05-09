const express = require('express');
const axios = require('axios');
const router = express.Router();

// Gewinnwahrscheinlichkeit basierend auf OpenLigaDB-Historie
router.get('/', async (req, res) => {
  const { team1, team2, season } = req.query;
  if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 erforderlich' });

  try {
    // Letzte Saison laden
    const s = season || '2024';
    const response = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/${s}`);
    const allGames = response.data;

    // Alle Spiele zwischen den Teams filtern
    const h2h = allGames.filter(g =>
      (g.Team1.ShortName === team1 || g.Team1.TeamName.includes(team1)) &&
      (g.Team2.ShortName === team2 || g.Team2.TeamName.includes(team2)) ||
      (g.Team1.ShortName === team2 || g.Team1.TeamName.includes(team2)) &&
      (g.Team2.ShortName === team1 || g.Team2.TeamName.includes(team1))
    ).filter(g => g.MatchIsFinished);

    // Alle Heimspiele von team1
    const homeGames = allGames.filter(g =>
      (g.Team1.ShortName === team1 || g.Team1.TeamName.includes(team1)) &&
      g.MatchIsFinished
    );

    // Berechnung
    let wins = 0, draws = 0, losses = 0;
    homeGames.forEach(g => {
      const r = g.MatchResults?.[0];
      if (!r) return;
      if (r.PointsTeam1 > r.PointsTeam2) wins++;
      else if (r.PointsTeam1 === r.PointsTeam2) draws++;
      else losses++;
    });

    const total = wins + draws + losses || 1;
    const homeWin = Math.round((wins / total) * 100 * 10) / 10;
    const draw = Math.round((draws / total) * 100 * 10) / 10;
    const awayWin = Math.round(((100 - homeWin - draw)) * 10) / 10;

    res.json({
      team1,
      team2,
      home_win: homeWin,
      draw,
      away_win: awayWin,
      sample_size: total,
      h2h_games: h2h.length,
      based_on: `${total} Heimspiele von ${team1} in Saison ${s}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
