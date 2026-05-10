# ✅ StatNerds – TODO-Liste

> Stand: Mai 2026 · Aktueller Status wird laufend aktualisiert

---

## Phase 1 – Projektfundament ✅

- [x] **1.1** Repository-Struktur anlegen (`/frontend`, `/backend`, `/db`)
- [x] **1.2** `docker-compose.yml` mit Services: Backend, Frontend, PostgreSQL
- [x] **1.3** `Dockerfile` für Backend
- [x] **1.4** `Dockerfile` für Frontend
- [x] **1.5** Lokales Setup testen: `docker compose up`
- [x] **1.6** `.env.example` mit Umgebungsvariablen
- [x] **1.7** `README.md` mit Setup-Anleitung

---

## Phase 2 – Backend-Grundstruktur ✅

- [x] **2.1** Backend-Grundgerüst (Express, Health-Endpoint `/health`)
- [x] **2.2** Datenbankverbindung (PostgreSQL via `pg`)
- [x] **2.3** API-Router-Struktur (`/routes/games.js`, `/routes/teams.js`, `/routes/prediction.js`)
- [x] **2.4** `.dockerignore` für Backend & Frontend
- [ ] **2.5** Datenbank-Migrationen einrichten (Prisma/Flyway)
- [ ] **2.6** DB-Schema: Tabellen für Teams, Spiele, Stats, Cache

---

## Phase 3 – API-Integrationen ✅ (teilweise)

- [x] **3.1** **OpenLigaDB** – Bundesliga-Spiele, Tabelle, Spieltage
- [x] **3.2** **OpenLigaDB** – Torjägerliste (aggregiert aus allen Spieltagen)
- [x] **3.3** In-Memory-Cache für alle Endpunkte (1–60 Min TTL)
- [x] **3.4** Auto-Refresh im Frontend alle 60 Sekunden
- [ ] **3.5** **TheSportsDB** – Vereinsinfos, Logos, Gründungsjahr
- [ ] **3.6** **API-Football** – Live-xG, Schüsse, Ballbesitz (benötigt API-Key)
- [ ] **3.7** Cron-Job für Hintergrund-Datenabruf
- [ ] **3.8** Fehlerbehandlung & Fallback bei API-Ausfall

---

## Phase 4 – Gewinnwahrscheinlichkeit ✅

- [x] **4.1** Basis-Algorithmus (Heim/Auswärts/Unentschieden in %)
- [x] **4.2** Prediction-Bar im Frontend (grün/gelb/rot)
- [x] **4.3** H2H-Endpunkt `/api/games/bl1/h2h?team1=X&team2=Y` (letzte 3 Saisons)
- [ ] **4.4** Erweiterte Prediction mit xG-Daten (API-Football Key nötig)
- [ ] **4.5** Prediction in DB cachen

---

## Phase 5 – Frontend-Grundstruktur ✅

- [x] **5.1** React-App mit Mehrseiten-Struktur (`pages/`)
- [x] **5.2** Sticky Navbar mit aktiver Seite
- [x] **5.3** Theme-System mit localStorage-Persistenz
- [x] **5.4** Bundesliga-Theme als Standard, Vereinsthemes wählbar

---

## Phase 6 – Frontend-Spielansichten ✅

- [x] **6.1** Hero-Karte (erstes Spiel groß)
- [x] **6.2** Alle Spiele als kompakte Karten darunter
- [x] **6.3** Vereinslogos neben Teamnamen
- [x] **6.4** Halbzeitergebnis angezeigt
- [x] **6.5** Torschützenliste mit Minute, Elfmeter, Eigentor
- [x] **6.6** 🔴 LIVE-Indikator
- [x] **6.7** Spieltag-Selector Dropdown (alle 34 Spieltage)
- [ ] **6.8** Spieldetail-Seite mit vollem H2H-Vergleich
- [ ] **6.9** Animationen & Übergänge

---

## Phase 7 – Einstellungsseite ✅

- [x] **7.1** Einstellungsseite als eigene Route
- [x] **7.2** Theme-Auswahl (Bundesliga, Werder, Bayern, BVB, ...)
- [x] **7.3** API-Key-Eingabe & localStorage-Speicherung
- [x] **7.4** Datenbankbereinigung mit Dropdown (7/14/30 Tage / Alles)
- [x] **7.5** Datenquellen-Übersicht
- [ ] **7.6** Favoriten-Team wählen → Theme wird automatisch gesetzt
- [ ] **7.7** Benachrichtigungs-Einstellungen (Tor-Push)

---

## Phase 8 – Torjäger & Statistiken 🔄 (in Arbeit)

- [x] **8.1** Torjägerliste-Seite (`/scorers`) mit Top 30
- [x] **8.2** 🥇🥈🥉 Medaillen für Top 3
- [x] **8.3** Elfmeter & Eigentor-Spalten
- [ ] **8.4** Vorlagen-Rangliste (Assists)
- [ ] **8.5** Vereins-Statistikseite (Tore, Siege, Form)
- [ ] **8.6** H2H-Frontend-Seite mit Direktvergleich

---

## Phase 9 – Weitere Features 📋 (geplant)

- [ ] **9.1** Push-Notifications bei Toren (Web Push API)
- [ ] **9.2** Favoriten-Spiele anpinnen
- [ ] **9.3** Mehrere Ligen (2. Bundesliga, Champions League, Premier League)
- [ ] **9.4** Dark/Light-Mode Toggle
- [ ] **9.5** PWA (installierbar auf Handy)
- [ ] **9.6** Spielerprofilseite mit Saisonstatistiken

---

## Phase 10 – Qualität & Deployment 📋 (geplant)

- [ ] **10.1** Responsive Design (Mobile-Optimierung)
- [ ] **10.2** Ladeanimationen & Error-States
- [ ] **10.3** Toast-Notifications für Fehler
- [ ] **10.4** Unit-Tests für Prediction-Algorithmus
- [ ] **10.5** CI/CD Pipeline (GitHub Actions → Auto-Deploy)
- [ ] **10.6** HTTPS mit Reverse Proxy (nginx + Let's Encrypt)
- [ ] **10.7** Finale README mit Screenshots
