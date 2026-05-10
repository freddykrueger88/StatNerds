const express = require('express');
const axios = require('axios');
const cache = require('../cache');
const router = express.Router();

// Vereinsstatistiken aus allen Spieltagen aggregieren
router.get('/bl1', async (req, res) => {
  const cacheKey = 'teamstats_bl1';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const currentRes = await axios.get('https://api.openligadb.de/getcurrentgroup/bl1');
    const currentMatchday = currentRes.data?.groupOrderID || 34;
    const matchdays = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);

    const responses = await Promise.all(
      matchdays.map(md =>
        axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`)
          .then(r => r.data).catch(() => [])
      )
    );

    const teams = {};
    const ensure = (name, logo) => {
      if (!teams[name]) teams[name] = {
        name, logo, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, form: [], cleanSheets: 0,
      };
    };

    responses.flat().filter(m => m.matchIsFinished).forEach(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      if (!final) return;
      const h = m.team1?.shortName || m.team1?.teamName;
      const a = m.team2?.shortName || m.team2?.teamName;
      const hG = final.pointsTeam1;
      const aG = final.pointsTeam2;
      ensure(h, m.team1?.teamIconUrl);
      ensure(a, m.team2?.teamIconUrl);

      teams[h].played++;  teams[a].played++;
      teams[h].goalsFor += hG;  teams[h].goalsAgainst += aG;
      teams[a].goalsFor += aG;  teams[a].goalsAgainst += hG;

      if (hG > aG) {
        teams[h].wins++; teams[h].form.push('W');
        teams[a].losses++; teams[a].form.push('L');
      } else if (hG === aG) {
        teams[h].draws++; teams[h].form.push('D');
        teams[a].draws++; teams[a].form.push('D');
      } else {
        teams[h].losses++; teams[h].form.push('L');
        teams[a].wins++; teams[a].form.push('W');
      }
      if (hG === 0) teams[a].cleanSheets++;
      if (aG === 0) teams[h].cleanSheets++;
    });

    const result = Object.values(teams).map(t => ({
      ...t,
      goalDiff: t.goalsFor - t.goalsAgainst,
      avgGoalsFor: t.played ? Math.round((t.goalsFor / t.played) * 100) / 100 : 0,
      avgGoalsAgainst: t.played ? Math.round((t.goalsAgainst / t.played) * 100) / 100 : 0,
      form: t.form.slice(-5), // Letzte 5 Spiele
      winRate: t.played ? Math.round((t.wins / t.played) * 100) : 0,
    })).sort((a, b) => b.wins - a.wins || b.goalDiff - a.goalDiff);

    cache.set(cacheKey, result, 20 * 60 * 1000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
