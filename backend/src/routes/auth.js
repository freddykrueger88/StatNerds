const express = require('express');
const crypto = require('crypto');
const pool = require('../db');

const router = express.Router();

const SECRET = process.env.AUTH_SECRET || 'dev-secret-nur-fuer-lokal';
const TOKEN_TTL = 30 * 24 * 60 * 60; // 30 Tage

// ── Passwort-Hashing (scrypt, kein bcrypt-Dependency nötig) ─────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const derived = crypto.scryptSync(String(password), salt, 32).toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex')); } catch { return false; }
}

// ── HMAC-Token (JWT-artig, ohne Abhängigkeit) ──────────────────────────
function b64url(input) { return Buffer.from(JSON.stringify(input)).toString('base64url'); }
function b64urlDecode(s) { return JSON.parse(Buffer.from(s, 'base64url').toString('utf8')); }

function signToken(user) {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({ sub: user.id, email: user.email, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL });
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const [h, p, s] = String(token).split('.');
    const expect = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expect))) return null;
    const payload = b64urlDecode(p);
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// Auth-Middleware: verlangt gültiges Bearer-Token
function requireAuth(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Ungültiges oder abgelaufenes Token' });
  req.user = { id: payload.sub, email: payload.email };
  next();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

// Als Einstellungen synchronisierbare localStorage-Schlüssel (Frontend-Keys)
const SYNC_KEYS = ['favorites', 'theme', 'notifyConfig', 'mode', 'fontSize', 'league'];

async function getSettings(userId) {
  const { rows } = await pool.query('SELECT key, value FROM user_settings WHERE user_id = $1', [userId]);
  const out = {};
  rows.forEach(r => { out[r.key] = JSON.parse(r.value); });
  return out;
}

async function mergeSettings(userId, payload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const allowed = Object.entries(payload || {}).filter(([k]) => SYNC_KEYS.includes(k));
    for (const [k, v] of allowed) {
      await client.query(
        `INSERT INTO user_settings (user_id, key, value, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [userId, k, JSON.stringify(v ?? null)]
      );
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

// ── Routes ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!validateEmail(email)) return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
    if (!password || String(password).length < 8) return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });

    const existing = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'E-Mail ist bereits registriert' });

    const hash = hashPassword(password);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [String(email).trim().toLowerCase(), hash]
    );
    const user = rows[0];
    const { settings } = req.body || {};
    if (settings && Object.keys(settings).length) await mergeSettings(user.id, settings);

    res.status(201).json({ token: signToken(user), user, settings: await getSettings(user.id) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [String(email || '').trim()]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });

    const { settings } = req.body || {};
    if (settings && Object.keys(settings).length) await mergeSettings(user.id, settings);

    res.json({ token: signToken(user), user: { id: user.id, email: user.email }, settings: await getSettings(user.id) });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    res.json({ user: { id: req.user.id, email: req.user.email }, settings: await getSettings(req.user.id) });
  } catch (err) { next(err); }
});

// Server-seitige Einstellungen/Favoriten aktualisieren
router.put('/sync', requireAuth, async (req, res, next) => {
  try {
    const payload = req.body?.settings || {};
    await mergeSettings(req.user.id, payload);
    res.json({ ok: true, settings: await getSettings(req.user.id) });
  } catch (err) { next(err); }
});

module.exports = router;
