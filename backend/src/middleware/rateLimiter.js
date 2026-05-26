const rateLimit = require('express-rate-limit');

// Allgemeines Rate-Limit für alle /api Endpunkte
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 300,
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
