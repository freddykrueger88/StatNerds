const express = require('express');
const cache   = require('../cache');
// loadAllMatchdays() aus games.js wiederverwenden statt eigene Requests
const { loadAllMatchdays } = require('./games');

const router = express.Router();

// GET /api/teamstats/bl1
router.get('/bl1', async (req, res, next) => {
  const cacheKey = 'teamstats_bl1';
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const teams  = {};
    const ensure = (name, logo) => {
      if (!teams[name]) teams[name] = {
        teamName: name, teamIconUrl: logo,
        played: 0, wins: 0, draws: 0, losses: 0,
        goals: 0, goalsAgainst: 0,
        form: [], cleanSheets: 0,
      };
    };

    const all = await loadAllMatchdays();
    all.filter(m => m.matchIsFinished).forEach(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      if (!final) return;

      const h  = m.team1?.shortName || m.team1?.teamName;
      const a  = m.team2?.shortName || m.team2?.teamName;
      const hG = final.pointsTeam1;
      const aG = final.pointsTeam2;

      ensure(h, m.team1?.teamIconUrl);
      ensure(a, m.team2?.teamIconUrl);

      teams[h].played++;  teams[a].played++;
      teams[h].goals        += hG;  teams[h].goalsAgainst += aG;
      teams[a].goals        += aG;  teams[a].goalsAgainst += hG;

      if (hG > aG) {
        teams[h].wins++;   teams[h].form.push('W');
        teams[a].losses++; teams[a].form.push('L');
      } else if (hG === aG) {
        teams[h].draws++;  teams[h].form.push('D');
        teams[a].draws++;  teams[a].form.push('D');
      } else {
        teams[h].losses++; teams[h].form.push('L');
        teams[a].wins++;   teams[a].form.push('W');
      }

      if (hG === 0) teams[a].cleanSheets++;
      if (aG === 0) teams[h].cleanSheets++;
    });

    const result = Object.values(teams)
      .map(t => ({
        ...t,
        goalDiff:   t.goals - t.goalsAgainst,
        avgGoals:   t.played ? Math.round((t.goals / t.played) * 100) / 100 : 0,
        form:       t.form.join('').slice(-5),
        winRate:    t.played ? Math.round((t.wins / t.played) * 100) : 0,
      }))
      .sort((a, b) => b.wins - a.wins || b.goalDiff - a.goalDiff);

    cache.set(cacheKey, result, 20 * 60 * 1000);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
