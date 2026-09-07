'use strict';

const express = require('express');
const { resolveSeason } = require('./games');

const router = express.Router();

// ── GET /api/meta/seasons ─────────────────────────────────────────────────────
// Pro OpenLigaDB-Liga die tatsächlich verwendete Saison (resolveSeason berücksichtigt
// den Fallback, falls die laufende Saison bei OpenLigaDB noch fehlt – z.B. fbl1).
// „isCurrent: false" ⇒ Jahr < SEASON (Datenquelle hat die neue Saison noch nicht).
const OPENDL_LIGA = ['bl1', 'bl2', 'fbl1', 'bbl'];
const SEASON = Number(process.env.BL_SEASON || String(new Date().getFullYear()));

router.get('/seasons', async (req, res, next) => {
  try {
    const out = {};
    for (const league of OPENDL_LIGA) {
      const year = Number(await resolveSeason(league));
      out[league] = {
        year,
        label: `${year}/${String((year + 1) % 100).padStart(2, '0')}`,
        isCurrent: year === SEASON,
      };
    }
    res.json(out);
  } catch (err) { next(err); }
});

module.exports = router;