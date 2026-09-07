'use strict';

const express = require('express');
const axios   = require('axios');
const cache   = require('../cache');

const router = express.Router();

// TheSportsDB-Karrierefeld: Einträge durch Zeilenumbrüche getrennt, leere herausfiltern.
function parseCareer(raw) {
  if (!raw) return [];
  return String(raw).split(/\r?\n+/).map(s => s.trim()).filter(Boolean);
}

// GET /api/players/:id  (TheSportsDB-Spielerprofil)
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `player_${id}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);
  try {
    const r = await axios.get(
      `https://www.thesportsdb.com/api/v1/json/3/lookupplayer.php?id=${id}`,
      { timeout: 8000 }
    );
    const p = r.data?.players?.[0];
    if (!p) return res.status(404).json({ error: 'Spieler nicht gefunden' });
    const profile = {
      id, name: p.strPlayer,
      photo: p.strThumb || p.strCutout, cutout: p.strCutout,
      nationality: p.strNationality,
      birthDate: p.dateBorn, birthLocation: p.strBirthLocation,
      position: p.strPosition, number: p.intSquadNumber || p.strNumber,
      team: p.strTeam, height: p.strHeight, weight: p.strWeight,
      descriptionDE: p.strDescriptionDE, descriptionEN: p.strDescriptionEN,
      career: parseCareer(p.strCareer),
    };
    cache.set(cacheKey, profile, 24 * 60 * 60 * 1000);
    res.json(profile);
  } catch (err) { next(err); }
});

module.exports = router;