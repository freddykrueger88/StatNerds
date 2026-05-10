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
- [x] **2.3** API-Router-Struktur
- [x] **2.4** `.dockerignore` für Backend & Frontend
- [x] **2.5** Datenbank-Migrationen (Prisma ORM)
- [x] **2.6** DB-Schema: Teams, Spiele, Goals, Stats, Broadcast, ApiCache

---

## Phase 3 – API-Integrationen 🔄 (teilweise)

- [x] **3.1** **OpenLigaDB** – Spiele, Tabelle, Spieltage
- [x] **3.2** **OpenLigaDB** – Torjägerliste
- [x] **3.3** In-Memory-Cache (1–60 Min TTL)
- [x] **3.4** Auto-Refresh alle 60s
- [ ] **3.5** **TheSportsDB** – Vereinsinfos, Logos, Gründungsjahr
- [ ] **3.6** **API-Football** – Live-xG, Schüsse, Ballbesitz
- [ ] **3.7** Cron-Job für Hintergrund-Datenabruf
- [ ] **3.8** Fehlerbehandlung & Fallback bei API-Ausfall

---

## Phase 4 – Gewinnwahrscheinlichkeit ✅

- [x] **4.1** Basis-Algorithmus (Heim/Auswärts/Unentschieden)
- [x] **4.2** Prediction-Bar im Frontend
- [x] **4.3** H2H-Endpunkt (letzte 3 Saisons)
- [ ] **4.4** Erweiterte Prediction mit xG-Daten
- [ ] **4.5** Prediction in DB cachen

---

## Phase 5 – Frontend-Grundstruktur ✅

- [x] **5.1** React-App mit Mehrseiten-Struktur
- [x] **5.2** Sticky Navbar
- [x] **5.3** Theme-System mit localStorage
- [x] **5.4** Bundesliga-Theme als Standard

---

## Phase 6 – Frontend-Spielansichten ✅

- [x] **6.1** Hero-Karte (erstes Spiel groß)
- [x] **6.2** Kompakte Karten für alle Spiele
- [x] **6.3** Vereinslogos
- [x] **6.4** Halbzeitergebnis
- [x] **6.5** Torschützenliste (Minute, Elfmeter, Eigentor)
- [x] **6.6** 🔴 LIVE-Indikator
- [x] **6.7** Spieltag-Selector Dropdown
- [ ] **6.8** Spieldetail-Seite mit H2H-Vergleich
- [ ] **6.9** Animationen & Übergänge

---

## Phase 7 – Einstellungsseite ✅

- [x] **7.1** Einstellungsseite als eigene Route
- [x] **7.2** Theme-Auswahl (Bundesliga, Werder, Bayern, BVB, ...)
- [x] **7.3** API-Key-Verwaltung mit direktem Link zur Registrierungsseite:
  - [x] API-Football (https://dashboard.api-football.com/register)
  - [x] TheSportsDB (https://www.thesportsdb.com/api.php)
  - [x] Football-Data.org (https://www.football-data.org/client/register)
  - [x] RapidAPI (https://rapidapi.com/hub)
- [x] **7.4** Datenbankbereinigung (7/14/30 Tage / Alles)
- [x] **7.5** Datenquellen-Übersicht
- [x] **7.6** App-Info Footer (Name, Version, GitHub-Link) – zentriert unten
- [ ] **7.7** Favoriten-Team wählen → Theme automatisch setzen
- [ ] **7.8** Benachrichtigungs-Einstellungen (Tor-Push)

---

## Phase 8 – Torjäger & Statistiken 🔄 (in Arbeit)

- [x] **8.1** Torjägerliste-Seite mit Top 30
- [x] **8.2** 🥇🥈🥉 Medaillen für Top 3
- [x] **8.3** Elfmeter & Eigentor-Spalten
- [ ] **8.4** Vorlagen-Rangliste (Assists)
- [ ] **8.5** Vereins-Statistikseite (Tore, Siege, Form)
- [ ] **8.6** H2H-Frontend-Seite mit Direktvergleich

---

## Phase 9 – TV, Schiedsrichter & Kommentatoren 📋 (geplant)

- [ ] **9.1** 🎥 TV-Übertragung pro Land (DAZN, Sky, ARD, ZDF...)
- [ ] **9.2** 🔵 Schiedsrichter pro Spiel (API-Football)
- [ ] **9.3** 🎤 Kommentator / Moderator nach Land
- [ ] **9.4** Backend-Endpunkt `/api/games/bl1/broadcast`
- [ ] **9.5** Info-Block in der Spielkarte

---

## Phase 10 – Weitere Features 📋 (geplant)

- [ ] **10.1** Push-Notifications bei Toren
- [ ] **10.2** Favoriten-Spiele anpinnen
- [ ] **10.3** Mehrere Ligen (2. BL, CL, Premier League)
- [ ] **10.4** Dark/Light-Mode Toggle
- [ ] **10.5** PWA (installierbar auf Handy)
- [ ] **10.6** Spielerprofilseite

---

## Phase 11 – Qualität & Deployment 📋 (geplant)

- [ ] **11.1** Responsive Design / Mobile-Optimierung
- [ ] **11.2** Ladeanimationen & Error-States
- [ ] **11.3** Toast-Notifications
- [ ] **11.4** Unit-Tests Prediction-Algorithmus
- [ ] **11.5** CI/CD Pipeline (GitHub Actions)
- [ ] **11.6** HTTPS (nginx + Let's Encrypt)
- [ ] **11.7** Finale README mit Screenshots
