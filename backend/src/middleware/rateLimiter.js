const rateLimit = require('express-rate-limit');

// Allgemeines Rate-Limit für alle /api Endpunkte.
// Mit gültigem API-Key (req.apiKey, via loadApiKey gesetzt) gilt ein
// deutlich höheres, keyed Budget – anonyme Aufrufe limitiert per IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: (req) => (req.apiKey ? 3000 : 300),
  keyGenerator: (req) => (req.apiKey ? `key:${req.apiKey.api_key}` : req.ip),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Zu viele Anfragen, bitte später erneut versuchen.', retryAfter: '15 min' },
  skip: (req) => req.path === '/api/health', // Health-Check immer durchlassen
});

// Strenges Limit für Cleanup-Endpunkt
const cleanupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Cleanup-Limit erreicht.' },
});

module.exports = { apiLimiter, cleanupLimiter };
