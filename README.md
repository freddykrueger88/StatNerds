# 📊 StatNerds

> Bundesliga Live-Statistiken, xG, Prognosen, Torjäger, Vereinsstatistiken & mehr – self-hosted, dark mode, mobil-optimiert.

![Version](https://img.shields.io/badge/version-0.5.1-E32221?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Node.js%20%2B%20PostgreSQL-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Features

### ⚽ Spiele
- Aktueller Spieltag mit Live-Ergebnissen (auto-refresh 60s)
- Spieltag-Selector (alle 34 Spieltage)
- Hero-Card für das erste Spiel mit Torschützen-Timeline
- Prognose-Balken direkt auf der Karte (Sieg H / Unentschieden / Sieg A)
- Skeleton-Loader & Error-State mit Retry-Button

### 📋 Spieldetail
- Großes Score-Hero mit Vereinslogos
- Halbzeitergebnis
- Torschützenliste mit Minute, Elfmeter- & Eigentor-Markierung
- **TV-Übertragung** (Sky, DAZN, SAT.1, ARD, ZDF – DE/AT/CH)
- **Schiedsrichter** mit Bio + Live-Daten via API-Football
- Spielstatistiken (xG, Ballbesitz, Schüsse, Fouls, Karten…)
- Direkte Duelle (H2H letzte 3 Saisons)
- KI-Prognose

### 📊 Tabelle
- Bundesliga-Tabelle 2025/26
- Vereinslogos, Punkte, Tordifferenz, Form
- Champions-League / Abstiegs-Zonen farblich markiert

### 🥅 Statistiken (Torjäger & Vorlagen)
- Top-30 Torjäger mit Elfmeter & Eigentor-Spalte
- Top-30 Vorlagengeber (Assists)
- Tabs: ⚽ Torjäger / 🤝 Vorlagen – lazy loaded

### 📞 Vereinsstatistiken
- Alle 18 Vereine als Cards
- Sortierbar nach: Siege, Tore, Tordifferenz, Clean Sheets, Ø Tore/Spiel, Siegquote
- Form-Badges letzte 5 Spiele (S/U/N)
- Vereinslogo, Durchschnittswerte

### 🏟️ Vereinsinfos
- Vereinsprofile mit Stadion, Gründungsjahr, Vereinsfarben
- Logos via TheSportsDB

### 🔔 Push-Notifications
- Browser-Push bei neuen Toren (auch im Hintergrund)
- Service Worker für Offline-Fallback
- Ein-Klick Toggle in der Navbar

### ⚙️ Einstellungen
- **Lieblingsverein** → Theme passt sich automatisch an
- 19 Vereins-Themes (Bayern, BVB, Werder, Leverkusen…) + Dark
- API-Key Verwaltung (lokal in localStorage)
- Datenbankbereinigung

### 📱 Mobile / PWA
- Bottom-Navigation für Mobile (<600px)
- Installierbar als PWA (Android & iOS)
- Touch-optimiert (44px Targets, kein 300ms Delay)
- iPhone Safe-Area kompatibel

---

## 🚀 Setup

### Voraussetzungen
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Git

### Schnellstart

```bash
git clone https://github.com/freddykrueger88/StatNerds.git
cd StatNerds
cp .env.example .env
docker compose up -d --build
```

App läuft unter: **http://localhost:3000**  
Backend API: **http://localhost:8000**

### .env Konfiguration

```env
# Datenbank
DATABASE_URL=postgresql://statnerds:statnerds@db:5432/statnerds

# Optional: API-Football (100 Req/Tag kostenlos)
API_FOOTBALL_KEY=dein_key_hier
```

---

## 🔑 API-Keys (optional)

Die App funktioniert **ohne API-Keys** über OpenLigaDB (kostenlos, kein Key nötig).

Für erweiterte Features (xG, Live-Stats, Schiedsrichter, TV-Sender) können optionale Keys hinterlegt werden:

| API | Kosten | Features | Link |
|---|---|---|---|
| **API-Football** | Free (100/Tag) | xG, Live-Stats, Schiedsrichter, Spielerinfos | [dashboard.api-football.com](https://dashboard.api-football.com/register) |
| **TheSportsDB** | Free / Patreon | Vereinslogos, Stadionfotos, Spielerbilder | [thesportsdb.com](https://www.thesportsdb.com/api.php) |
| **Football-Data.org** | Free | Int. Ligen, Champions League | [football-data.org](https://www.football-data.org/client/register) |
| **RapidAPI Sport** | Paid | Weitere Sport-APIs | [rapidapi.com](https://rapidapi.com/hub) |

Keys werden in den **Einstellungen (⚙️)** eingetragen und nur lokal im Browser gespeichert.

---

## 🏗️ Architektur

```
StatNerds/
├── frontend/          # React App (Create React App)
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json  # PWA
│   │   └── sw.js          # Service Worker
│   └── src/
│       ├── App.js
│       ├── pages/         # Games, Table, Scorers, TeamStats, Teams, Settings
│       ├── components/    # GameDetail, StatsBar, Toast, Skeleton, BroadcastBadge…
│       └── hooks/         # useNotifications
├── backend/           # Express.js API
│   └── src/
│       ├── server.js
│       ├── cache.js       # In-Memory Cache
│       ├── scheduler.js   # Auto-Refresh Scheduler
│       └── routes/        # games, teams, teamstats, broadcast, referee, prediction…
├── docker-compose.yml
└── .env.example
```

### Datenquellen

| Quelle | Was | Key |
|---|---|---|
| **OpenLigaDB** | Spielplan, Ergebnisse, Tabelle, Torschützen | ❌ kein Key |
| **TheSportsDB** | Logos, Vereinsinfos | ❌ Free-Tier |
| **API-Football** | xG, Live-Stats, TV, Schiedsrichter | ✅ optional |
| **Football-Data.org** | Int. Ligen | ✅ optional |

---

## 🐳 Docker Services

| Service | Port | Beschreibung |
|---|---|---|
| `frontend` | 3000 | React App |
| `backend` | 8000 | Express API |
| `db` | 5432 | PostgreSQL |

```bash
# Logs
docker compose logs -f backend

# Nur Backend neu bauen
docker compose up -d --build backend

# Datenbank zurücksetzen
docker compose down -v && docker compose up -d --build
```

---

## 📡 API Endpoints

```
GET  /api/health                    → Status + Version
GET  /api/games/bl1/current         → Aktueller Spieltag
GET  /api/games/bl1/:matchday       → Bestimmter Spieltag
GET  /api/games/bl1/table           → Tabelle
GET  /api/games/bl1/scorers         → Torjägerliste Top 30
GET  /api/games/bl1/assists         → Vorlagen Top 30
GET  /api/games/bl1/h2h             → Head-to-Head
GET  /api/teamstats/bl1             → Vereinsstatistiken
GET  /api/broadcast/:date           → TV-Sender für Spielzeit
GET  /api/referee/profile/:name     → Schiedsrichter-Profil
GET  /api/prediction                → Match-Prognose
GET  /api/teams/bl1                 → Vereinsinfos
DEL  /api/stats/cleanup             → DB bereinigen
```

---

## 🛠️ Entwicklung

```bash
# Frontend lokal (Hot Reload)
cd frontend && npm install && npm start

# Backend lokal
cd backend && npm install && npm run dev
```

---

## 📝 Changelog

| Version | Features |
|---|---|
| 0.5.1 | Schiedsrichter-Info, TV-Übertragung |
| 0.5.0 | Vereinsstatistiken, PWA, Mobile Nav |
| 0.4.0 | Lieblingsverein-Selector, Auto-Theme |
| 0.3.0 | Vorlagen-Rangliste, Skeleton-Loader, Toast-System |
| 0.2.0 | Spieldetail, H2H, xG-Stats, Prognose |
| 0.1.0 | Spielplan, Tabelle, Torjäger, Themes |

---

## 🤝 Contributing

Pull Requests willkommen! Bitte einen Feature-Branch erstellen:

```bash
git checkout -b feat/mein-feature
# ... Änderungen ...
git push origin feat/mein-feature
```

---

<div align="center">
  Made with ❤️ & ⚽ · <a href="https://github.com/freddykrueger88/StatNerds">GitHub</a>
</div>
