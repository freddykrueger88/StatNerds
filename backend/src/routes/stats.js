const express  = require('express');
const pool     = require('../db');
const { cleanupLimiter }  = require('../middleware/rateLimiter');
const { requireApiKey }   = require('../middleware/requireApiKey');

const router = express.Router();

/**
 * DELETE /api/stats/cleanup?days=30
 * Löscht Statistik-Einträge die älter als `days` Tage sind.
 * days=0 löscht ALLE Einträge.
 * Geschützt durch Admin-API-Key + strenges Rate-Limit.
 */
router.delete('/cleanup', cleanupLimiter, requireApiKey, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days);
    let result;
    if (days === 0) {
      result = await pool.query('DELETE FROM stats');
    } else {
      const safeDays = isNaN(days) ? 30 : days;
      result = await pool.query(
        `DELETE FROM stats WHERE updated_at < NOW() - INTERVAL '1 day' * $1`,
        [safeDays]
      );
    }
    res.json({ deleted: result.rowCount, days: days === 0 ? 'all' : days });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
