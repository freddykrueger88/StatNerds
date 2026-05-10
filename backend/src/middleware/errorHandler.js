// Zentraler Error-Handler mit Fallback-Logik
const cache = require('../cache');

function withFallback(cacheKey, fallbackData = null) {
  return (err, req, res, next) => {
    console.error(`❌ API-Fehler [${req.path}]:`, err.message);

    // Versuche alten Cache-Eintrag als Fallback
    const stale = cache.get(cacheKey);
    if (stale) {
      console.warn(`⚠️  Fallback auf gecachte Daten für: ${cacheKey}`);
      return res.json({ ...stale, _stale: true, _error: err.message });
    }

    if (fallbackData) return res.json({ ...fallbackData, _error: err.message });

    res.status(503).json({
      error: 'Dienst vorübergehend nicht verfügbar',
      details: err.message,
      retryAfter: 30
    });
  };
}

function globalErrorHandler(err, req, res, next) {
  console.error('❌ Unbehandelter Fehler:', err.message);
  res.status(500).json({ error: 'Interner Serverfehler', details: err.message });
}

module.exports = { withFallback, globalErrorHandler };
