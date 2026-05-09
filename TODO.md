# ✅ StatNerds – TODO-Liste (Priorisierte Reihenfolge)

> Aufgaben sind in sinnvoller Entwicklungsreihenfolge sortiert: Infrastruktur → Backend → Datenquellen → Frontend → Features → Qualität

---

## Phase 1 – Projektfundament

- [ ] **1.1** Repository-Struktur anlegen (`/frontend`, `/backend`, `/db`, `/docker`)
- [ ] **1.2** `docker-compose.yml` erstellen mit Services: Backend, Frontend, PostgreSQL, (optional Redis)
- [ ] **1.3** `Dockerfile` für Backend erstellen
- [ ] **1.4** `Dockerfile` für Frontend erstellen
- [ ] **1.5** Lokales Setup testen: `docker compose up` → alle Services starten
- [ ] **1.6** `.env.example` mit allen benötigten Umgebungsvariablen (API-Keys, DB-Zugangsdaten) anlegen
- [ ] **1.7** `README.md` mit Setup-Anleitung schreiben

---

## Phase 2 – Datenbank & Backend-Grundstruktur

- [ ] **2.1** Datenbankschema entwerfen: Tabellen für Sportarten, Mannschaften, Spiele, Statistiken
- [ ] **2.2** Datenbank-Migrationen einrichten (z. B. Flyway, Alembic oder Prisma)
- [ ] **2.3** Backend-Grundgerüst aufsetzen (API-Router, Health-Endpoint)
- [ ] **2.4** Datenbankverbindung im Backend herstellen und testen
- [ ] **2.5** API-Adapter-Interface definieren (Abstraktionsschicht für verschiedene Sport-APIs)

---

## Phase 3 – API-Integrationen

- [ ] **3.1** **The Sports DB** API-Adapter implementieren (Vereinsinfos, Logos, Vereinsfarben)
- [ ] **3.2** **OpenLigaDB** API-Adapter implementieren (Bundesliga-Daten, kostenlos)
- [ ] **3.3** **Football-Data.org** API-Adapter implementieren (internationale Ligen)
- [ ] **3.4** **API-Sports** API-Adapter implementieren (Free-Tier, mehrere Sportarten)
- [ ] **3.5** Cron-Job / Scheduler für regelmäßiges Datenabrufen einrichten
- [ ] **3.6** Live-Daten-Polling implementieren (falls API unterstützt, z. B. alle 60s)
- [ ] **3.7** Fehlerbehandlung & Fallback bei API-Ausfall implementieren

---

## Phase 4 – Statistik-Logik & Gewinnwahrscheinlichkeit

- [ ] **4.1** Statistik-Aggregationslogik implementieren (Ballbesitz, Schüsse, xG etc.)
- [ ] **4.2** Algorithmus für Gewinnwahrscheinlichkeit entwickeln (Heimsieg / Auswärtssieg / Unentschieden) auf Basis historischer Daten
- [ ] **4.3** Berechnungsergebnisse in Datenbank cachen
- [ ] **4.4** REST-Endpunkte für Spiele, Statistiken und Wahrscheinlichkeiten erstellen
- [ ] **4.5** Endpunkt für Vereinsinfos und Sportart-Informationen erstellen

---

## Phase 5 – Frontend-Grundstruktur

- [ ] **5.1** Frontend-Projekt initialisieren (React/Vue + Tailwind CSS)
- [ ] **5.2** Routing einrichten: Startseite, Spieldetail, Einstellungen
- [ ] **5.3** API-Service-Layer im Frontend einrichten (Axios/Fetch-Wrapper)
- [ ] **5.4** Globales State-Management aufsetzen (z. B. Zustand, Pinia)
- [ ] **5.5** Theme-System implementieren (CSS-Variablen für Vereinsfarben)

---

## Phase 6 – Frontend-Spielansichten

- [ ] **6.1** **Hero-Ansicht** implementieren: Ein Spiel über volle Bildschirmbreite (Einzelansicht oben)
- [ ] **6.2** **Kachelansicht** implementieren: Mehrere Spiele gleichzeitig anzeigbar
- [ ] **6.3** Umschalter zwischen Einzel- und Mehrfachansicht bauen
- [ ] **6.4** Detaillierte Statistikanzeige pro Spiel (alle verfügbaren Metriken)
- [ ] **6.5** Gewinnwahrscheinlichkeitsanzeige in Prozent mit visueller Darstellung (Progress-Bar / Donut-Chart)
- [ ] **6.6** Live-Indikator und automatisches Aktualisieren der Live-Daten im UI
- [ ] **6.7** Vereinslogos und -farben dynamisch laden und anzeigen

---

## Phase 7 – Einstellungsseite

- [ ] **7.1** Einstellungsseite als eigene Route anlegen
- [ ] **7.2** **Sportarten verwalten**: Sportart hinzufügen / entfernen
- [ ] **7.3** **Mannschaften verwalten**: Favoriten-Mannschaft hinzufügen / entfernen (mit Suche)
- [ ] **7.4** **Theme-Auswahl**: Liste verfügbarer Themes, automatisch aus Vereinsfarben generierbar
- [ ] **7.5** **Datenbankbereinigung**: Dropdown-Menü mit Optionen:
  - Statistiken älter als 7 Tage löschen
  - Statistiken älter als 14 Tage löschen
  - Statistiken älter als 30 Tage löschen
  - Alle gespeicherten Statistiken löschen
- [ ] **7.6** API-Key-Verwaltung in den Einstellungen (für APIs die Keys benötigen)

---

## Phase 8 – Vereins- & Sportart-Infoseiten

- [ ] **8.1** Vereinsdetailseite: Logo, Geschichte, Gründungsjahr, Liga, Stadion (aus The Sports DB)
- [ ] **8.2** Sportart-Infoseite: Beschreibung, Regelwerk-Grundlagen, aktive Ligen
- [ ] **8.3** Navigation zu Vereins-/Sportartseite aus der Spielansicht heraus

---

## Phase 9 – Qualität & Polishing

- [ ] **9.1** Responsive Design sicherstellen (Mobile, Tablet, Desktop)
- [ ] **9.2** Ladeanimationen und Error-States implementieren
- [ ] **9.3** Einheitliche Fehlerbehandlung im Frontend (Toast-Notifications)
- [ ] **9.4** Unit-Tests für Gewinnwahrscheinlichkeits-Algorithmus schreiben
- [ ] **9.5** API-Endpunkte mit einfachen Tests absichern
- [ ] **9.6** `docker compose up` End-to-End-Test auf frischer Maschine durchführen
- [ ] **9.7** Finale `README.md` mit Screenshots, Features und API-Doku vervollständigen
