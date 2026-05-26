/**
 * API-Key-Schutz für sensitive Endpunkte (z.B. /stats/cleanup).
 * Key wird per ADMIN_API_KEY Umgebungsvariable gesetzt.
 * Nur x-api-key Header akzeptiert – kein query-Param (wäre in Server-Logs sichtbar).
 */
function requireApiKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    return res.status(503).json({ error: 'Admin-Endpunkt nicht konfiguriert.' });
  }

  const provided = req.headers['x-api-key'];

  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: 'Ungültiger oder fehlender API-Key.' });
  }

  next();
}

module.exports = { requireApiKey };
