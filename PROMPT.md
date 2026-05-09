# 📊 StatNerds – Projekt-Prompt

## Projektname
**StatNerds**

> Ein Tool für Statistik-Nerds: Sport-Statistiken so penibel, detailliert und übersichtlich wie möglich – mit Live-Daten, Gewinnwahrscheinlichkeiten und voller Konfigurierbarkeit.

---

## Vision

StatNerds ist eine lokal betreibbare Web-App (Docker/Docker Compose), die öffentlich verfügbare Sport-APIs anzapft und Statistiken auf höchstem Detailgrad visualisiert. Zielgruppe sind Daten-Nerds, Fußball-Taktik-Fans und alle, die über den normalen Spielstand hinaus denken.

---

## Kern-Anforderungen

### 🐳 Infrastruktur
- Lauffähig via **Docker** und **Docker Compose**
- Vollständig **lokal betreibbar** (kein Cloud-Zwang)
- Datenbank zur Speicherung von Statistiken (z. B. PostgreSQL oder SQLite)

### 📡 Datenquellen (Open/Free APIs)
- **The Sports DB** (https://www.thesportsdb.com/api.php) – kostenlose API für Vereine, Spieler, Ergebnisse
- **OpenLigaDB** (https://www.openligadb.de) – deutsche Bundesliga, komplett kostenlos
- **Football-Data.org** (https://www.football-data.org) – kostenloser Tier für viele Ligen
- **API-Sports** (https://api-sports.io) – kostenloser Free-Tier verfügbar
- **ESPN Public Endpoints** – öffentlich zugänglich, inoffiziell

### 🖥️ Anzeigemodi
- **Einzelansicht**: Ein Spiel, das oben über die gesamte Bildschirmbreite angezeigt wird (Hero-Ansicht)
- **Mehrfachansicht**: Mehrere Spiele gleichzeitig in einer Kachelansicht
- Umschaltbar über die Benutzeroberfläche

### 📈 Statistik-Features
- Möglichst **penible, detaillierte Statistiken** (Ballbesitz, Passquoten, Expected Goals xG, Schüsse, Fouls, Karten, Laufleistungen etc.)
- **Gewinnwahrscheinlichkeit** in Prozent für:
  - Heimsieg
  - Auswärtssieg
  - Unentschieden
  - Berechnung auf Basis der vorhandenen historischen Daten
- **Live-Statistiken** falls von der API unterstützt

### ⚙️ Einstellungen (Settings-Seite)
- Eigene **Einzel-Seite** für alle Einstellungen
- **Sportart hinzufügen/entfernen** (z. B. Fußball, Basketball, Tennis)
- **Mannschaften hinzufügen/entfernen** (Favoriten-Mannschaften konfigurieren)
- **Themes** wählbar, idealerweise basierend auf Vereinsfarben (Primär- und Sekundärfarbe des Vereins)
- **Datenbankbereinigung**: Gespeicherte Statistiken löschen per Dropdown
  - z. B. "älter als 7 Tage", "älter als 14 Tage", "älter als 30 Tage", "alles löschen"

### 📚 Vereins- und Sportart-Infos
- Vereinsinformationen aus öffentlicher API (z. B. The Sports DB)
- Sportart-Beschreibungen und Regelwerke aus öffentlicher Quelle
- Darstellung auf der jeweiligen Detailseite

### 🔧 Erweiterbarkeit
- Architektur muss **modular** aufgebaut sein
- Neue Sportarten und Mannschaften ohne Code-Änderungen hinzufügbar (über UI/Settings)
- API-Adapter-Pattern damit neue Datenquellen einfach integrierbar sind

---

## Tech-Stack (Vorschlag)

| Schicht | Technologie |
|---|---|
| Frontend | React oder Vue.js + Tailwind CSS |
| Backend | Node.js (Express) oder Python (FastAPI) |
| Datenbank | PostgreSQL (via Docker) |
| Caching | Redis (optional, für Live-Daten) |
| Containerisierung | Docker + Docker Compose |
| API-Integration | REST-Clients für die oben genannten APIs |

---

## Namensgebung
**StatNerds** – kurz, prägnant, trifft die Zielgruppe.
