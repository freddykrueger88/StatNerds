# 📊 StatNerds – Penible Sport-Statistiken

![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)

> Ein Tool für Statistik-Nerds: Live-Scores, xG, Gewinnwahrscheinlichkeiten in % und detaillierte Metriken aus kostenlosen APIs.

## 🚀 Schnellstart

```bash
git clone https://github.com/freddykrueger88/StatNerds.git
cd StatNerds
cp .env.example .env
docker compose up -d --build
```

**Fertig in ~60 Sekunden!**

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Health Check | http://localhost:8000/health |
| DB Test | http://localhost:8000/test-db |
| Bundesliga Live | http://localhost:8000/api/games/bl1 |

## 📡 Kostenlose APIs

- **[OpenLigaDB](https://openligadb.de)** – Bundesliga, kein Key nötig
- **[TheSportsDB](https://thesportsdb.com)** – Teams, Logos, Farben
- **[API-Football](https://api-sports.io)** – Live-Stats, Free-Tier

## 🛠️ Tech-Stack

| Layer | Tech |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Datenbank | PostgreSQL 16 |
| Cache | Redis 7 |
| Container | Docker + Compose |

## 🛑 Befehle

```bash
docker compose up -d --build   # Starten
docker compose logs -f backend # Logs
docker compose down            # Stoppen
docker compose down -v         # Stoppen + DB löschen
```

## DB Bereinigung

```bash
# Statistiken älter als 14 Tage löschen
curl -X DELETE http://localhost:8000/api/stats/cleanup?days=14
```

Weitere Details: [PROMPT.md](./PROMPT.md) | [TODO.md](./TODO.md)
