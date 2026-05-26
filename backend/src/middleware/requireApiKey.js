/**
 * Einfacher API-Key-Schutz für sensitive Endpunkte (z.B. /stats/cleanup).
 * Key wird per ADMIN_API_KEY Umgebungsvariable gesetzt.
 */
function requireApiKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;

  // Falls kein Key konfiguriert ist, Endpunkt sperren
  if (!adminKey) {
    return res.status(503).json({ error: 'Admin-Endpunkt nicht konfiguriert.' });
  }

  const provided = req.headers['x-api-key'] || req.query.apiKey;

  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: 'Ungültiger oder fehlender API-Key.' });
  }

  next();
}

module.exports = { requireApiKey };
