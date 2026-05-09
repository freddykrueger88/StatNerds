const express = require('express');
const axios = require('axios');
const router = express.Router();

// Simple in-memory cache
const cache = {};
function getCache(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) { delete cache[key]; return null; }
  return entry.data;
}
function setCache(key, data, ttlMs) {
  cache[key] = { data, ts: Date.now(), ttl: ttlMs };
}

// Aktueller Spieltag
router.get('/bl1/current', async (req, res) => {
  try {
    const cached = getCache('current');
    if (cached) return res.json(cached);
    const response = await axios.get('https://api.openligadb.de/getmatchdata/bl1');
    setCache('current', response.data, 60 * 1000); // 1 min
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'OpenLigaDB nicht erreichbar' });
  }
});

// Bestimmter Spieltag
router.get('/bl1/:matchday(\\d+)', async (req, res) => {
  try {
    const md = req.params.matchday;
    const key = `md_${md}`;
    const cached = getCache(key);
    if (cached) return res.json(cached);
    const response = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`);
    setCache(key, response.data, 5 * 60 * 1000); // 5 min
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Spieltag nicht verf\u00fcgbar' });
  }
});

// Tabelle
router.get('/bl1/table', async (req, res) => {
  try {
    const cached = getCache('table');
    if (cached) return res.json(cached);
    const response = await axios.get('https://api.openligadb.de/getbltable/bl1/2025');
    setCache('table', response.data, 10 * 60 * 1000); // 10 min
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Tabelle nicht verf\u00fcgbar' });
  }
});

// Torj\u00e4gerliste mit Cache (15 min)
router.get('/bl1/scorers', async (req, res) => {
  try {
    const cached = getCache('scorers');
    if (cached) return res.json(cached);

    const currentRes = await axios.get('https://api.openligadb.de/getcurrentgroup/bl1');
    const currentMatchday = currentRes.data?.groupOrderID || 33;
    const matchdays = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);

    const responses = await Promise.all(
      matchdays.map(md =>
        axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`)
          .then(r => r.data).catch(() => [])
      )
    );

    const scorerMap = {};
    responses.flat().forEach(match => {
      (match.goals || []).forEach(goal => {
        if (!goal.goalGetterName?.trim()) return;
        const name = goal.goalGetterName;
        const team = goal.isOwnGoal
          ? (match.team2?.shortName || match.team2?.teamName)
          : (match.team1?.shortName || match.team1?.teamName);
        if (!scorerMap[name]) scorerMap[name] = { name, team, goals: 0, penalties: 0, ownGoals: 0 };
        if (goal.isOwnGoal) scorerMap[name].ownGoals++;
        else { scorerMap[name].goals++; if (goal.isPenalty) scorerMap[name].penalties++; }
      });
    });

    const sorted = Object.values(scorerMap)
      .filter(s => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 30);

    setCache('scorers', sorted, 15 * 60 * 1000); // 15 min
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Torj\u00e4gerliste nicht verf\u00fcgbar' });
  }
});

// H2H - Head to Head zwischen zwei Teams
router.get('/bl1/h2h', async (req, res) => {
  try {
    const { team1, team2 } = req.query;
    if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 ben\u00f6tigt' });

    const cacheKey = `h2h_${team1}_${team2}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    // Letzte 3 Saisons laden
    const seasons = [2023, 2024, 2025];
    const allMatches = [];
    for (const season of seasons) {
      for (let md = 1; md <= 34; md++) {
        try {
          const r = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/${season}/${md}`);
          const relevant = r.data.filter(m => {
            const t1 = (m.team1?.shortName || m.team1?.teamName || '').toLowerCase();
            const t2 = (m.team2?.shortName || m.team2?.teamName || '').toLowerCase();
            const q1 = team1.toLowerCase();
            const q2 = team2.toLowerCase();
            return (t1.includes(q1) && t2.includes(q2)) || (t1.includes(q2) && t2.includes(q1));
          });
          allMatches.push(...relevant);
          if (relevant.length) break; // Pro Saison nur ein Direktduell
        } catch { continue; }
      }
    }

    const result = allMatches.map(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      return {
        date: m.matchDateTime,
        home: m.team1?.shortName || m.team1?.teamName,
        away: m.team2?.shortName || m.team2?.teamName,
        score: final ? `${final.pointsTeam1}:${final.pointsTeam2}` : null,
        finished: m.matchIsFinished,
        goals: m.goals || []
      };
    });

    setCache(cacheKey, result, 60 * 60 * 1000); // 1h
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'H2H nicht verf\u00fcgbar' });
  }
});

// Spieltagsliste (f\u00fcr Selector)
router.get('/bl1/matchdays', async (req, res) => {
  try {
    const cached = getCache('matchdays');
    if (cached) return res.json(cached);
    const r = await axios.get('https://api.openligadb.de/getavailablegroups/bl1/2025');
    setCache('matchdays', r.data, 60 * 60 * 1000);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: 'Spieltage nicht verf\u00fcgbar' });
  }
});

module.exports = router;
