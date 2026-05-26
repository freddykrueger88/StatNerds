# 📊 StatNerds – TODO / Roadmap

> Stand: Mai 2026 · Version 0.6.0

---

## ✅ Abgeschlossen (0.1.0 – 0.6.0)

### Fundament & Infrastruktur
- [x] Repository-Struktur (`/frontend`, `/backend`, `/db`)
- [x] `docker-compose.yml` mit Backend, Frontend, PostgreSQL
- [x] `Dockerfile` für Backend & Frontend
- [x] `.env.example` mit allen Variablen
- [x] `README.md` mit Setup-Anleitung & Architektur

### Backend
- [x] Express-Server mit `/api/` Prefix auf allen Routen
- [x] PostgreSQL Pool (`db.js`) – geteilt, kein Prisma
- [x] Zentraler In-Memory Cache mit TTL, Hit-Rate, flush()
- [x] Scheduler (Spieltag, Tabelle, Cache-Invalidierung) mit Graceful Shutdown
- [x] Globaler Error-Handler (Axios-Fehler → 502, Rate-Limit → 429)
- [x] Rate-Limiting (300 Req/15 min, Cleanup 5/h, Health immer frei)
- [x] CORS mit `ALLOWED_ORIGINS` aus `.env`
- [x] Admin-Key-Schutz für `/api/stats/cleanup`
- [x] Alle Routen nutzen `next(err)` – keine direkten `res.status(500)`
- [x] Alle Routen nutzen zentralen `require('../cache')` – kein lokaler Cache
- [x] H2H: 102 Requests parallel statt sequentiell
- [x] `prediction.js`: 3 Saisons parallel geladen

### Frontend
- [x] React SPA mit Mehrseiten-Navigation
- [x] `services/api.js` – einziger Ort für alle fetch()-Aufrufe
- [x] `useFetch(fetcher, interval, deps)` mit loading/error/data/lastUpdate
- [x] `useLocalStorage(key, default)` – kein direktes localStorage in Komponenten
- [x] `useCountdown`, `useFavorites`, `useNotifications`
- [x] Alle Komponenten (inkl. BroadcastBadge, PredictionBlock, RefereeBlock) nutzen Hooks
- [x] Theme-System mit 18 Vereinsthemes + Dark Mode
- [x] Lieblingsverein-Selector → Theme automatisch
- [x] PWA (Service Worker, manifest.json, installierbar)
- [x] Mobile Bottom-Nav, iPhone Safe-Area, 44px Touch-Targets
- [x] Skeleton-Loader, ErrorState mit Retry, Toast-System
- [x] Push-Notifications (Browser-Push bei Toren)
- [x] Spieldetail: Score-Hero, Torschützen, H2H, xG-Stats
- [x] TV-Übertragung pro Land (DE/AT/CH)
- [x] Schiedsrichter-Block mit Bio
- [x] Prognose-Balken (historisch + xG-Modell)
- [x] Tabelle mit CL/Abstiegs-Zonen
- [x] Torjäger & Assists Top 30
- [x] Vereinsstatistiken (sortierbar, Form-Badges)
- [x] Vereinsprofile via TheSportsDB
- [x] Einstellungen: API-Keys, Themes, Cleanup, Datenquellen

---

## 🔧 Bekannte offene Punkte (Tech Debt)

- [ ] **Unit-Tests** für `poissonPrediction()` und `buildScorerMap()`
- [ ] **GitHub Actions CI** – lint + test bei jedem Push
- [ ] **`/api/health`** – DB-Verbindungscheck einbauen (aktuell nur Cache-Stats)
- [ ] **Spieltag auto-detect** – Saison-Konstante `2025` in allen Routen dynamisch machen

---

## 🚧 Nächste Features

### Liga-Erweiterung
- [ ] 2. Bundesliga (OpenLigaDB: `bl2`)
- [ ] Champions League (Football-Data.org)
- [ ] Premier League, La Liga
- [ ] Liga-Selector im Frontend

### Spieler
- [ ] Spielerprofilseite (Foto, Statistiken, Karriere)
- [ ] Kader-Übersicht pro Verein

### UX
- [ ] Animationen & Seitenübergänge
- [ ] Suche (Spieler, Verein, Spiel)
- [ ] Share-Button für Spieldetail

### Deployment
- [ ] HTTPS via nginx + Let’s Encrypt
- [ ] GitHub Actions: Build + Deploy
- [ ] `docker-compose.prod.yml` mit Resource-Limits
- [ ] Healthcheck-Endpoint mit DB-Ping

---

## 💡 Ideen-Backlog

- Basketball (NBA, BBL)
- Tennis, Eishockey
- Tipp-Spiel für Freunde
- Spieltag-Rückblick mit KI-Zusammenfassung
- Export als CSV / PDF
