const pool = require('../db');

// Lädt einen gültigen API-Key aus dem x-api-key-Header und hängt ihn an
// req.apiKey. Läuft VOR dem globalen Rate-Limiter, damit dieses im
// Keyed-Modus (höheres Budget) arbeiten kann.
async function loadApiKey(req, _res, next) {
  const key = String(req.headers['x-api-key'] || '').trim();
  if (!key) return next();
  try {
    const { rows } = await pool.query(
      'SELECT id, name, api_key FROM api_keys WHERE api_key = $1 AND enabled = TRUE',
      [key]
    );
    if (rows.length) req.apiKey = rows[0];
  } catch {}
  next();
}

// Schützt Endpunkte, die einen API-Key zwingend verlangen (nur Admin-Maßnahmen)
function requireApiKey(req, res, next) {
  if (!req.apiKey) return res.status(401).json({ error: 'Gültiger x-api-key erforderlich.' });
  next();
}

module.exports = { loadApiKey, requireApiKey };
