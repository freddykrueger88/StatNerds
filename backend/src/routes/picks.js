const express = require('express');
const pool = require('../db');
const cache = require('../cache');
const { requireAuth } = require('./auth');
const { loadAllMatchdays } = require('./games');

const router = express.Router();

const ALLOWED_LEAGUES = ['bl1', 'bl2', 'fbl1', 'bbl'];

// ── Punktesystem (Issue #23) ────────────────────────────────────────────────
// 3 Punkte exaktes Ergebnis, 1 Punkt richtige Tendenz, sonst 0.
function scorePick(pick, actualHome, actualAway) {
  const ph = Number(pick.home_score);
  const pa = Number(pick.away_score);
  if (Number.isFinite(ph) && Number.isFinite(pa) &&
      ph === actualHome && pa === actualAway) return 3;
  const win = (a, b) => (a > b ? 1 : a < b ? -1 : 0);
  if (win(ph, pa) === win(actualHome, actualAway)) return 1;
  return 0;
}

function validateScores(home, away) {
  const h = Number(home);
  const a = Number(away);
  if (!Number.isInteger(h) || !Number.isInteger(a)) return null;
  if (h < 0 || a < 0 || h > 20 || a > 20) return null;
  return { home: h, away: a };
}

// ── POST /api/picks/:league — Tipp abgeben/aktualisieren ───────────────────
router.post('/:league', requireAuth, async (req, res, next) => {
  try {
    const { league } = req.params;
    if (!ALLOWED_LEAGUES.includes(league)) return res.status(400).json({ error: 'Unbekannte Liga' });

    const { matchId, matchDate, teamHome, teamAway } = req.body || {};
    const scores = validateScores(req.body?.homeScore, req.body?.awayScore);
    if (!matchId || !scores) return res.status(400).json({ error: 'matchId sowie homeScore/awayScore (0–20) erforderlich' });

    // Tipps erst vor Anstoß (Server-seitige Absicherung)
    const kickoff = matchDate ? new Date(matchDate) : null;
    if (kickoff && kickoff.getTime() <= Date.now()) {
      return res.status(409).json({ error: 'Das Spiel hat bereits begonnen – Tipp nicht mehr möglich' });
    }

    const { rows } = await pool.query(
      `INSERT INTO picks (user_id, league, match_id, match_date, team_home, team_away, home_score, away_score, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id, league, match_id)
       DO UPDATE SET team_home = EXCLUDED.team_home, team_away = EXCLUDED.team_away,
                    home_score = EXCLUDED.home_score, away_score = EXCLUDED.away_score,
                    match_date = EXCLUDED.match_date, updated_at = NOW()
       RETURNING id, league, match_id, home_score, away_score`,
      [req.user.id, league, String(matchId), kickoff, teamHome ?? null, teamAway ?? null, scores.home, scores.away]
    );
    res.status(201).json({ ok: true, pick: rows[0] });
  } catch (err) { next(err); }
});

// ── GET /api/picks/:league/mine — eigene Tipps (mit Punkten bei Finale) ────
router.get('/:league/mine', requireAuth, async (req, res, next) => {
  try {
    const { league } = req.params;
    const { rows } = await pool.query('SELECT * FROM picks WHERE user_id = $1 AND league = $2 ORDER BY match_date ASC', [req.user.id, league]);

    const all = await loadAllMatchdays(league).catch(() => []);
    const resultByMatch = new Map();
    (all || []).forEach(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      if (final) resultByMatch.set(String(m.matchID), { home: final.pointsTeam1, away: final.pointsTeam2 });
    });

    const picks = rows.map(p => {
      const resl = resultByMatch.get(String(p.match_id));
      return {
        ...p,
        points: resl ? scorePick(p, resl.home, resl.away) : null,
        result: resl || null,
      };
    });
    res.json(picks);
  } catch (err) { next(err); }
});

// ── GET /api/picks/:league/ranking — globale Rangliste ─────────────────────
// Punkte je Nutzer über alle beendeten Spiele der Liga. Optional `users`-Query
// (kommagetrennte E-Mails) ⇒ "Rangliste unter Freunden".
router.get('/:league/ranking', async (req, res, next) => {
  try {
    const { league } = req.params;
    const cacheKey = `picks_ranking_${league}_${req.query.users || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const all = await loadAllMatchdays(league).catch(() => []);
    const resultByMatch = new Map();
    (all || []).forEach(m => {
      const final = (m.matchResults || []).find(r => r.resultTypeID === 2);
      if (final) resultByMatch.set(String(m.matchID), { home: final.pointsTeam1, away: final.pointsTeam2 });
    });
    const finishedMatches = [...resultByMatch.keys()];

    const filterUsers = req.query.users
      ? String(req.query.users).split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      : null;

    let userClause = '';
    const params = [league];
    if (filterUsers?.length) {
      userClause = 'AND lower(u.email) = ANY($2::text[])';
      params.push(filterUsers);
    }
    const { rows } = await pool.query(
      `SELECT u.id, u.email, p.league, p.match_id, p.home_score, p.away_score
       FROM picks p JOIN users u ON u.id = p.user_id
       WHERE p.league = $1 ${userClause}`,
      params
    );

    const acc = new Map();
    rows.forEach(r => {
      const resl = resultByMatch.get(String(r.match_id));
      if (!resl) return; // nur abgeschlossene Spiele werten (Tendenz bei Anstoß)
      const points = scorePick(r, resl.home, resl.away);
      const entry = acc.get(r.id) || { userId: r.id, email: r.email, points: 0, tips: 0, exact: 0, games: finishedMatches.length };
      entry.points += points;
      entry.tips += 1;
      if (points === 3) entry.exact += 1;
      acc.set(r.id, entry);
    });

    const ranking = [...acc.values()]
      .sort((a, b) => b.points - a.points || a.tips - b.tips)
      .map((e, i) => ({ rank: i + 1, ...e }));

    const out = { league, rankedGames: finishedMatches.length, ranking };
    cache.set(cacheKey, out, 60 * 1000);
    res.json(out);
  } catch (err) { next(err); }
});

module.exports = router;
