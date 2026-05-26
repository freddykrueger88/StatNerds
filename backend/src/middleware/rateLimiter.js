const rateLimit = require('express-rate-limit');

// Allgemeines Rate-Limit für alle API-Endpunkte
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 200,                  // max 200 Requests pro IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen, bitte später erneut versuchen.' }
});

// Strengeres Limit für den Cleanup-Endpunkt
const cleanupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Cleanup-Limit erreicht.' }
});

module.exports = { apiLimiter, cleanupLimiter };
