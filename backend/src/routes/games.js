const express = require('express');
const axios = require('axios');
const router = express.Router();

// Bundesliga via OpenLigaDB
router.get('/bl1', async (req, res) => {
  try {
    const season = req.query.season || '2024';
    const matchday = req.query.matchday || '34';
    const response = await axios.get(
      `https://api.openligadb.de/getmatchdata/bl1/${season}/${matchday}`
    );
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

// Tabelle
router.get('/bl1/table', async (req, res) => {
  try {
    const response = await axios.get('https://api.openligadb.de/getbltable/bl1/2024');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Tabelle nicht verfügbar' });
  }
});

module.exports = router;
