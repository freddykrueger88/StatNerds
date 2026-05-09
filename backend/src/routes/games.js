const express = require('express');
const axios = require('axios');
const router = express.Router();

// Bundesliga via OpenLigaDB
router.get('/bl1', async (req, res) => {
  try {
    const season = req.query.season || '2025';
    const matchday = req.query.matchday;
    const url = matchday
      ? `https://api.openligadb.de/getmatchdata/bl1/${season}/${matchday}`
      : `https://api.openligadb.de/getmatchdata/bl1/${season}/1`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'OpenLigaDB nicht erreichbar', details: err.message });
  }
});

// Aktueller Spieltag
router.get('/bl1/current', async (req, res) => {
  try {
    const response = await axios.get('https://api.openligadb.de/getmatchdata/bl1');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'OpenLigaDB nicht erreichbar' });
  }
});

// Tabelle – Saison 2025 korrekt
router.get('/bl1/table', async (req, res) => {
  try {
    const response = await axios.get('https://api.openligadb.de/getbltable/bl1/2025');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Tabelle nicht verfügbar' });
  }
});

// Torjägerliste – aggregiert aus allen Spieltagen der Saison 2025
router.get('/bl1/scorers', async (req, res) => {
  try {
    // Aktuelle Spieltagsnummer ermitteln
    const currentRes = await axios.get('https://api.openligadb.de/getcurrentgroup/bl1');
    const currentMatchday = currentRes.data?.groupOrderID || 33;

    // Alle bisherigen Spieltage parallel laden (max 34)
    const matchdays = Array.from({ length: Math.min(currentMatchday, 34) }, (_, i) => i + 1);
    const responses = await Promise.all(
      matchdays.map(md =>
        axios.get(`https://api.openligadb.de/getmatchdata/bl1/2025/${md}`)
          .then(r => r.data)
          .catch(() => [])
      )
    );

    // Torschützen aggregieren
    const scorerMap = {};
    responses.flat().forEach(match => {
      (match.goals || []).forEach(goal => {
        if (!goal.goalGetterName || goal.goalGetterName.trim() === '') return;
        const name = goal.goalGetterName;
        const team = goal.isOwnGoal
          ? (match.team2?.shortName || match.team2?.teamName)
          : (match.team1?.shortName || match.team1?.teamName);
        if (!scorerMap[name]) scorerMap[name] = { name, team, goals: 0, penalties: 0, ownGoals: 0 };
        if (goal.isOwnGoal) {
          scorerMap[name].ownGoals++;
        } else {
          scorerMap[name].goals++;
          if (goal.isPenalty) scorerMap[name].penalties++;
        }
      });
    });

    const sorted = Object.values(scorerMap)
      .filter(s => s.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 30);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Torjägerliste nicht verfügbar', details: err.message });
  }
});

module.exports = router;
