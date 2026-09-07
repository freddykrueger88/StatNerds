const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireApiKey } = require('../middleware/apikey');

const router = express.Router();

// API-Schlüssel-Verwaltung (Issue #19). Geschützt durch einen gültigen
// x-api-key – jeder (vergebene) Key darf weitere Schlüssel anlegen.
// Bewusst nicht über ADMIN_API_KEY, damit Dritte eigene Schlüssel vergeben
// können. Zum Start einen ersten Schlüssel manuell setzen:
//   INSERT INTO api_keys (api_key, name) VALUES (md5(random()::text), 'Bootstrap');

const MAX_KEYS = 20;

// Neuen API-Key erzeugen
router.post('/', requireApiKey, async (req, res, next) => {
  try {
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*)::int AS count FROM api_keys');
    if (count >= MAX_KEYS) return res.status(429).json({ error: `Maximal ${MAX_KEYS} API-Keys erlaubt.` });

    const name = String((req.body && req.body.name) || 'API-Key').slice(0, 100).trim() || 'API-Key';
    const apiKey = crypto.randomBytes(24).toString('hex');
    const { rows } = await pool.query(
      'INSERT INTO api_keys (api_key, name) VALUES ($1, $2) RETURNING id, name, api_key, enabled, created_at',
      [apiKey, name]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// Alle Keys auflisten (ohne den Schlüssel selbst mehrmals auszugeben – api_key wird gezeigt)
router.get('/', requireApiKey, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, api_key, enabled, created_at FROM api_keys ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Key deaktivieren/löschen
router.delete('/:id', requireApiKey, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.apiKey && req.apiKey.id === id) {
      return res.status(400).json({ error: 'Der eigene, aktive Key kann nicht gelöscht werden.' });
    }
    await pool.query('DELETE FROM api_keys WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
