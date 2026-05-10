const express = require('express');
const axios = require('axios');
const cache = require('../cache');
const router = express.Router();

// Aktueller Spieltag
router.get('/bl1/current', async (req, res) => {
  try {
    const cached = cache.get('current');
    if (cached) return res.json(cached);
    const response = await axios.get('https://api.openligadb.de/getmatchdata/bl1');
    cache.set('current', response.data, 60 * 1000);
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
    const cached = cache.get(key);
    if (cached) return res.json(cached);
    const response = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`);
    cache.set(key, response.data, 5 * 60 * 1000);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Spieltag nicht verf\u00fcgbar' });
  }
});

// Tabelle
router.get('/bl1/table', async (req, res) => {
  try {
    const cached = cache.get('table');
    if (cached) return res.json(cached);
    const response = await axios.get('https://api.openligadb.de/getbltable/bl1/2025');
    cache.set('table', response.data, 10 * 60 * 1000);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Tabelle nicht verf\u00fcgbar' });
  }
});

// Hilfsfunktion: alle Spieltage laden
async function loadAllMatchdays() {
  const cached = cache.get('all_matchdays_raw');
  if (cached) return cached;
  const currentRes = await axios.get('https://api.openligadb.de/getcurrentgroup/bl1');
  const currentMatchday = currentRes.data?.groupOrderID || 34;
  const matchdays = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);
  const responses = await Promise.all(
    matchdays.map(md =>
      axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`)
        .then(r => r.data).catch(() => [])
    )
  );
  const all = responses.flat();
  cache.set('all_matchdays_raw', all, 20 * 60 * 1000);
  return all;
}

// Torjägerliste
router.get('/bl1/scorers', async (req, res) => {
  try {
    const cached = cache.get('scorers');
    if (cached) return res.json(cached);
    const all = await loadAllMatchdays();
    const scorerMap = {};
    all.forEach(match => {
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
    const sorted = Object.values(scorerMap).filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 30);
    cache.set('scorers', sorted, 15 * 60 * 1000);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Torjägerliste nicht verfügbar' });
  }
});

// Vorlagen-Rangliste (Assists)
router.get('/bl1/assists', async (req, res) => {
  try {
    const cached = cache.get('assists');
    if (cached) return res.json(cached);
    const all = await loadAllMatchdays();
    const assistMap = {};
    all.forEach(match => {
      (match.goals || []).forEach(goal => {
        if (!goal.goalGetterName?.trim() || goal.isOwnGoal) return;
        // OpenLigaDB liefert keinen Vorlagengeber direkt – wir nutzen goalGetterName2 wenn vorhanden
        const assistName = goal.goalGetterName2?.trim();
        if (!assistName) return;
        const team = match.team1?.shortName || match.team1?.teamName;
        if (!assistMap[assistName]) assistMap[assistName] = { name: assistName, team, assists: 0 };
        assistMap[assistName].assists++;
      });
    });
    const sorted = Object.values(assistMap).filter(a => a.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 30);
    cache.set('assists', sorted, 15 * 60 * 1000);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Vorlagen nicht verfügbar' });
  }
});

// H2H
router.get('/bl1/h2h', async (req, res) => {
  try {
    const { team1, team2 } = req.query;
    if (!team1 || !team2) return res.status(400).json({ error: 'team1 und team2 benötigt' });
    const cacheKey = `h2h_${team1}_${team2}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const seasons = [2023, 2024, 2025];
    const allMatches = [];
    for (const season of seasons) {
      for (let md = 1; md <= 34; md++) {
        try {
          const r = await axios.get(`https://api.openligadb.de/getmatchdata/bl1/${season}/${md}`);
          const relevant = r.data.filter(m => {
            const t1 = (m.team1?.shortName || m.team1?.teamName || '').toLowerCase();
            const t2 = (m.team2?.shortName || m.team2?.teamName || '').toLowerCase();
            const q1 = team1.toLowerCase(); const q2 = team2.toLowerCase();
            return (t1.includes(q1) && t2.includes(q2)) || (t1.includes(q2) && t2.includes(q1));
          });
          allMatches.push(...relevant);
          if (relevant.length) break;
        } catch { continue; }
      }
    }
    const result = allMatches.map(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      return { date: m.matchDateTime, home: m.team1?.shortName || m.team1?.teamName, away: m.team2?.shortName || m.team2?.teamName, score: final ? `${final.pointsTeam1}:${final.pointsTeam2}` : null, finished: m.matchIsFinished };
    });
    cache.set(cacheKey, result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'H2H nicht verfügbar' });
  }
});

// Spieltagsliste
router.get('/bl1/matchdays', async (req, res) => {
  try {
    const cached = cache.get('matchdays');
    if (cached) return res.json(cached);
    const r = await axios.get('https://api.openligadb.de/getavailablegroups/bl1/2025');
    cache.set('matchdays', r.data, 60 * 60 * 1000);
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: 'Spieltage nicht verfügbar' });
  }
});

module.exports = router;
