// Globaler Error-Handler
function globalErrorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  console.error(`❌ [${req.method} ${req.path}] ${status}: ${err.message}`);

  // Axios-Fehler von externen APIs schön formatieren
  if (err.isAxiosError) {
    const upstream = err.response?.status;
    if (upstream === 429) {
      return res.status(429).json({ error: 'Externe API Rate-Limit erreicht', retryAfter: 60 });
    }
    return res.status(502).json({
      error:       'Externe API nicht erreichbar',
      upstream:    upstream || null,
      details:     err.message,
      retryAfter:  30,
    });
  }

  res.status(status).json({
    error:   status === 500 ? 'Interner Serverfehler' : err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

module.exports = { globalErrorHandler };
