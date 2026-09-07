const express = require('express');
const { loadAllMatchdays } = require('./games');
const cache = require('../cache');

const router = express.Router();

// Wöchentliche Ergebnis-Zusammenfassung der letzten 7 Tage.
// query: league (optional, comma-sep), teams (optional, comma-sep NamenFilter),
//        days (optional, default 7)
router.get('/summary', async (req, res, next) => {
  try {
    const leagues = (req.query.league ? String(req.query.league).split(',') : ['bl1', 'bl2', 'fbl1', 'bbl'])
      .map(l => l.trim())
      .filter(Boolean);
    const teamFilter = (req.query.teams ? String(req.query.teams).split(',') : [])
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
    const days = Math.min(parseInt(req.query.days, 10) || 7, 31);
    const from = Date.now() - days * 24 * 60 * 60 * 1000;

    const rowKey = `weekly_${[...leagues].sort().join(',')}_${days}_${teamFilter.join(',')}`;
    const cached = days <= 7 ? cache.get(rowKey) : null;
    if (cached) return res.json(cached);

    const results = [];
    await Promise.all(leagues.map(async league => {
      try {
        const all = await loadAllMatchdays(league);
        all.forEach(g => {
          if (!g.matchIsFinished) return;
          const date = new Date(g.matchDateTimeUTC || g.matchDateTime);
          if (date.getTime() < from || date.getTime() > Date.now()) return;
          const t1 = g.team1?.shortName || g.team1?.teamName;
          const t2 = g.team2?.shortName || g.team2?.teamName;
          const resl = (g.matchResults || []).find(r => r.resultTypeID === 2);
          if (!resl) return;
          if (teamFilter.length &&
            !(teamFilter.some(t => (t1 || '').toLowerCase().includes(t)) ||
              teamFilter.some(t => (t2 || '').toLowerCase().includes(t)))) return;
          results.push({
            league,
            date: date.toISOString(),
            matchID: g.matchID,
            home: t1, away: t2,
            homeGoals: resl.pointsTeam1,
            awayGoals: resl.pointsTeam2,
            group: g.group?.groupName || '',
            goals: (g.goals || []).map(goal => ({
              name: goal.goalGetterName,
              minute: goal.matchMinute,
              scoreTeam1: goal.scoreTeam1,
              scoreTeam2: goal.scoreTeam2,
              isPenalty: !!goal.isPenalty,
              isOwnGoal: !!goal.isOwnGoal,
            })),
          });
        });
      } catch (e) { /* Liga einzeln überspringen */ }
    }));

    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    const body = { generated: new Date().toISOString(), days, results };
    cache.set(rowKey, body, 60 * 60 * 1000);
    res.json(body);
  } catch (err) { next(err); }
});

module.exports = router;
