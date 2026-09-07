const express = require('express');
const router = express.Router();

// ── Öffentliche API-Dokumentation (Issue #19) ──────────────────────────
// OpenAPI 3.0.0-JSON unter /api/docs.json, einfach lesbare HTML-Seite
// unter /api/docs. Keine externe Swagger-UI-Abhängigkeit – dokumentiert
// werden die relevanten öffentlichen Endpunkte.

const OPENAPI = {
  openapi: '3.0.0',
  info: {
    title: 'StatNerds Public API',
    description: 'Öffentliche REST-API der StatNerds-Sportdatenplattform (Bundesliga & Co.). Ein API-Key (x-api-key) hebt das Rate-Limit von 300 auf 3000 Anfragen pro 15 Minuten – ohne Key bleibt die API anonym nutzbar.',
    version: '0.7.0',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Spiele', description: 'Spielplan, Ergebnisse, Tabellen, Torschützen' },
    { name: 'Statistiken', description: 'Form, H2H, Teamvergleiche, Saisonvergleiche' },
    { name: 'Ligen', description: 'Meta-Infos und Saisonauflösung' },
    { name: 'Aktivitäten', description: 'Wöchentliche Zusammenfassungen' },
    { name: 'Authentifizierung', description: 'Benutzerkonten & API-Keys' },
  ],
  paths: {
    '/games/{league}/current': {
      get: {
        tags: ['Spiele'], summary: 'Aktueller Spieltag', description: 'Alle Spiele des aktuellen Spieltags einer Liga (OpenLigaDB).',
        parameters: [{ name: 'league', in: 'path', required: true, schema: { type: 'string', enum: ['bl1', 'bl2', 'fbl1', 'bbl'] } }],
        responses: { 200: { description: 'Spiele des aktuellen Spieltags' } },
      },
    },
    '/games/{league}/{matchday}': {
      get: {
        tags: ['Spiele'], summary: 'Spieltag abrufen', description: 'Alle Spiele eines bestimmten Spieltags.',
        parameters: [
          { name: 'league', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'matchday', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Spiele des Spieltags' } },
      },
    },
    '/games/{league}/table': {
      get: {
        tags: ['Spiele'], summary: 'Tabelle', description: 'Tabelle der Liga, optional für eine frühere Saison.',
        parameters: [
          { name: 'league', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'season', in: 'query', schema: { type: 'integer' }, description: 'Jahr der Saison (z.B. 2024)' },
        ],
        responses: { 200: { description: 'Tabelle' } },
      },
    },
    '/games/{league}/scorers': {
      get: { tags: ['Spiele'], summary: 'Torschützenliste', responses: { 200: { description: 'Torschützen der Liga' } } },
      parameters: [{ name: 'league', in: 'path', required: true, schema: { type: 'string' } }],
    },
    '/games/{league}/assists': {
      get: { tags: ['Spiele'], summary: 'Vorlagenliste', parameters: [{ name: 'league', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Vorlagen der Liga' } } },
    },
    '/games/{league}/teamform': {
      get: {
        tags: ['Statistiken'], summary: 'Formkurve', description: 'Letzte 10 Pflichtspiele eines Teams aufsteigend mit Punkten.',
        parameters: [
          { name: 'league', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'team', in: 'query', required: true, schema: { type: 'string' }, description: 'Teamname' },
        ],
        responses: { 200: { description: 'Formkurve' } },
      },
    },
    '/games/{league}/teamwindow': {
      get: {
        tags: ['Spiele'], summary: 'Teamspiel-Fenster', description: 'Nächstes und letztes Spiel eines Teams.',
        parameters: [
          { name: 'league', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'team', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Spiel-Fenster' } },
      },
    },
    '/games/{league}/h2h': {
      get: {
        tags: ['Statistiken'], summary: 'Direkter Vergleich', description: 'H2H über die letzten 3 Saisons.',
        parameters: [
          { name: 'league', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'team1', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'team2', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Direkter Vergleich' } },
      },
    },
    '/games/{league}/compare': {
      get: {
        tags: ['Statistiken'], summary: 'Teamvergleich', description: 'Stats + Form zweier Teams samt Kurve.',
        parameters: [
          { name: 'league', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'team1', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'team2', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Teamvergleich' } },
      },
    },
    '/meta/seasons': {
      get: { tags: ['Ligen'], summary: 'Saisons', description: 'Echte Saison jeder Liga (kein Kalenderjahr-Raten).', responses: { 200: { description: 'Saison-Infos' } } },
    },
    '/weekly/summary': {
      get: {
        tags: ['Aktivitäten'], summary: 'Wochen-Zusammenfassung', description: 'Ergebnisse der letzten 7 Tage, optional nach Liga und Teams gefiltert.',
        parameters: [
          { name: 'league', in: 'query', schema: { type: 'string' }, description: 'Komma-getrennte Ligen, default bl1,bl2,fbl1,bbl' },
          { name: 'teams', in: 'query', schema: { type: 'string' }, description: 'Komma-getrennte Teamnamen (Filter)' },
          { name: 'days', in: 'query', schema: { type: 'integer', default: 7 }, description: 'Zeitraum in Tagen (max 31)' },
        ],
        responses: { 200: { description: 'Zusammenfassung' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentifizierung'], summary: 'Konto erstellen', description: 'Registriert einen Benutzer; liefert Token + Settings zurück.',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { 201: { description: 'Konto mit Token' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentifizierung'], summary: 'Anmelden',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Token + Settings' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentifizierung'], summary: 'Eigene Settings', description: 'Eigene User-Infos + serverside Settings (Bearer-Token).',
        parameters: [{ name: 'Authorization', in: 'header', required: true, schema: { type: 'string' }, description: 'Bearer <token>' }],
        responses: { 200: { description: 'User + Settings' } },
      },
    },
  },
};

// JSON-Doku
router.get('/docs.json', (req, res) => res.json(OPENAPI));

// HTML-Doku (lesbar ohne Swagger-UI)
router.get('/docs', (req, res) => {
  const rows = Object.entries(OPENAPI.paths).map(([path, methods]) => {
    const m = Object.entries(methods).find(([, v]) => v.summary) || [];
    if (!m.length) return '';
    const [method, def] = m;
    const params = Object.values(def.parameters || [])
      .map(p => `<span class="p">${p.in}:${p.name}${p.required ? '*' : ''}</span>`)
      .join(' ');
    return `<div class="ep"><span class="m ${method}">${method.toUpperCase()}</span><code>${path}</code><div class="sum">${def.summary}${params ? `<div class="params">${params}</div>` : ''}</div></div>`;
  }).join('');

  res.send(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>StatNerds API</title>
<style>
body{font-family:-apple-system,Segoe UI,sans-serif;background:#0f0f0f;color:#eee;max-width:820px;margin:0 auto;padding:2rem 1.25rem}
h1{color:#E32221}a{color:#7dd3fc}.sub{color:#888;margin-bottom:1.5rem}
.ep{background:#1a1a1a;border:1px solid #262626;border-left:4px solid #E32221;border-radius:8px;padding:.65rem .9rem;margin:.5rem 0}
.m{font-weight:700;font-size:.72rem;padding:.15rem .4rem;border-radius:4px;margin-right:.5rem;display:inline-block;min-width:58px;text-align:center}
.m.GET{background:#16a34a22;color:#4ade80}.m.POST{background:#2563eb22;color:#60a5fa}.m.DELETE{background:#dc262622;color:#f87171}.m.PUT{background:#d9770622;color:#fbbf24}
code{color:#fbbf24}.sum{color:#bbb;font-size:.85rem;margin-top:.3rem}.params{color:#555;font-size:.74rem;margin-top:.2rem}.p{background:#222;border-radius:4px;padding:.08rem .3rem;margin-right:.3rem}
</style></head><body>
<h1>📡 StatNerds Public API</h1>
<p class="sub">Offene Sportdaten via REST. Ohne Key: <strong>300 Anfragen / 15 min</strong> pro IP. Mit <code>x-api-key</code>: <strong>3000 / 15 min</strong>. <a href="/api/docs.json" target="_blank">OpenAPI-JSON</a> · <a href="/api/meta/seasons">Live: Saisons</a> · <a href="/api/weekly/summary">Live: Wochen-Zusammenfassung</a></p>
${rows}
</body></html>`);
});

module.exports = router;
