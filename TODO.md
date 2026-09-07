# 📊 StatNerds – TODO / Roadmap

> Stand: Mai 2026 · Version 0.7.0

---

## ✅ Abgeschlossen (0.1.0 – 0.7.0)

### Fundament & Infrastruktur
- [x] Repository-Struktur (`/frontend`, `/backend`, `/db`)
- [x] `docker-compose.yml` mit Backend, Frontend, PostgreSQL
- [x] `Dockerfile` für Backend & Frontend
- [x] `.env.example` mit allen Variablen inkl. `BL_SEASON`
- [x] `README.md` mit Setup-Anleitung & Architektur
- [x] **GitHub Actions CI** – Lint + Test (Backend) + Build (Frontend) bei jedem Push

### Backend
- [x] Express-Server mit `/api/` Prefix auf allen Routen
- [x] PostgreSQL Pool (`db.js`) – geteilt, kein Prisma
- [x] Zentraler In-Memory Cache mit TTL, Hit-Rate, flush()
- [x] Scheduler (Spieltag, Tabelle, Cache-Invalidierung) mit Graceful Shutdown
- [x] Globaler Error-Handler (Axios-Fehler → 502, Rate-Limit → 429)
- [x] Rate-Limiting (300 Req/15 min, Cleanup 5/h, Health immer frei)
- [x] CORS mit `ALLOWED_ORIGINS` aus `.env`
- [x] Admin-Key-Schutz für `/api/stats/cleanup` (nur Header, kein Query-Param)
- [x] Alle Routen nutzen `next(err)` – keine direkten `res.status(500)`
- [x] Alle Routen nutzen zentralen `require('../cache')` – kein lokaler Cache
- [x] H2H nutzt `loadAllMatchdays()` – kein 102-Request-Burst
- [x] `teamstats.js` nutzt `loadAllMatchdays()` via Export – kein Duplikat
- [x] `prediction.js`: 3 Saisons parallel geladen
- [x] **`/api/health`** mit DB-Ping, Latenz & Status 503 bei DB-Ausfall
- [x] **Saison-Konstante** `BL_SEASON` dynamisch aus `.env`
- [x] **Unit-Tests** für `poissonPrediction()` und `buildScorerMap()` (Jest)
- [x] **`BUNDESLIGA_TEAMS`** aktualisiert für Saison 2025/26 (Kiel + St. Pauli rein)

### Frontend
- [x] React SPA mit Mehrseiten-Navigation
- [x] `services/api.js` – einziger Ort für alle fetch()-Aufrufe
- [x] `useFetch(fetcher, interval, deps)` mit loading/error/data/lastUpdate
- [x] `useLocalStorage(key, default)` – kein direktes localStorage in Komponenten
- [x] Theme-System mit 18 Vereinsthemes + Dark Mode
- [x] Lieblingsverein-Selector → Theme automatisch
- [x] PWA (Service Worker, manifest.json, installierbar)
- [x] Mobile Bottom-Nav, iPhone Safe-Area, 44px Touch-Targets
- [x] Skeleton-Loader, ErrorState mit Retry, Toast-System
- [x] Push-Notifications (Browser-Push bei Toren)
- [x] Spieldetail: Score-Hero, Torschützen, H2H, xG-Stats
- [x] TV-Übertragung pro Land (DE/AT/CH) – im Frontend einstellbar
- [x] Schiedsrichter-Block mit Bio
- [x] Prognose-Balken (historisch + xG-Modell, compact-Modus)
- [x] Tabelle mit CL/Abstiegs-Zonen
- [x] Torjäger & Assists Top 30 (lazy fetch)
- [x] Vereinsstatistiken (sortierbar, Form-Badges)
- [x] Vereinsprofile via TheSportsDB
- [x] Einstellungen: API-Keys, Themes, Cleanup, Datenquellen, TV-Land

---

## 🚀 Nächste Features

### Liga-Erweiterung
- [x] 2. Bundesliga (OpenLigaDB: `bl2`)
- [x] Champions League (API-Football-Adapter, Key in Einstellungen)
- [x] Premier League (API-Football-Adapter, Key in Einstellungen)
- [x] La Liga (API-Football-Adapter, Key in Einstellungen)
- [x] Liga-Selector im Frontend
- [x] **Frauen-Bundesliga** (OpenLigaDB: `fbl1`, Saison-Fallback auf Vorjahr)

### Spieler
- [x] Spielerprofilseite (Foto, Saison-Statistiken via API-Football, Key nötig)
- [x] Kader-Übersicht pro Verein (API-Football-Squad, Key nötig)

### UX
- [x] Animationen & Seitenübergänge (Fade bei View-Wechsel)
- [x] Suche (Spieler + Verein; Spieler-Suche via API-Football, Key nötig)
- [x] Share-Button für Spieldetail (Web Share API, Fallback Clipboard)

### Deployment
- [x] HTTPS via Caddy + Let's Encrypt (`docker-compose.prod.yml`, `Caddyfile`)
- [x] GitHub Actions: Build + Deploy (SSH, `.github/workflows/deploy.yml`)
- [x] `docker-compose.prod.yml` mit Resource-Limits

### Export
- [x] CSV-Export (Tabelle, Torjäger, Vorlagen, Vereinsstatistiken)
- [x] PDF-Export (Browser-Druck – dependency-frei)

---

## 💡 Ideen-Backlog

- Basketball (NBA, BBL)
- Tennis, Eishockey
- Tipp-Spiel für Freunde
- Spieltag-Rückblick mit KI-Zusammenfassung
