# 📊 StatNerds – Penible Sport-Statistiken

![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-0.3.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

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
- **[Football-Data.org](https://football-data.org)** – Internationale Ligen

## 🛠️ Tech-Stack

| Layer | Tech |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Datenbank | PostgreSQL 16 |
| ORM | Prisma |
| Container | Docker + Compose |

## 🛝 Befehle

```bash
docker compose up -d --build   # Starten
docker compose logs -f backend # Logs
docker compose down            # Stoppen
docker compose down -v         # Stoppen + DB löschen
```

## DB Bereinigung

```bash
curl -X DELETE http://localhost:8000/api/stats/cleanup?days=14
```

---

## 📄 Lizenz & Attribution

MIT License – mach damit was du willst.

**Du musst mich nicht erwähnen.** Dieser Code ist zum größten Teil AI-generiert ("AI slop") und entstand in einer durchgemachten Nacht. Kein Credit nötig.

**ABER:** Wenn du daraus ein kommerzielles Produkt oder eine Premium-App baust und Geld damit verdienst — dann hätte ich gerne **lebenslangen, uneingeschränkten Premium-Zugang**. Das ist der Deal. 🤝

> Kontakt: [github.com/freddykrueger88](https://github.com/freddykrueger88)

---

Weitere Details: [TODO.md](./TODO.md)
