# PDF Vi3wer

Ein moderner, browserbasierter PDF-Reader mit **Bücherregal-Ansicht**, **Cloud-Speicherung über Supabase** und einer performanten, mobilfreundlichen Darstellung auf Basis von React + Vite.

## Inhaltsverzeichnis

- [Projektüberblick](#projektüberblick)
- [Features](#features)
- [Technischer Stack](#technischer-stack)
- [Architektur auf einen Blick](#architektur-auf-einen-blick)
- [Voraussetzungen](#voraussetzungen)
- [Schnellstart (lokal)](#schnellstart-lokal)
- [Supabase einrichten](#supabase-einrichten)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Verfügbare Skripte](#verfügbare-skripte)
- [Projektstruktur](#projektstruktur)
- [Wie die App funktioniert](#wie-die-app-funktioniert)
- [Sicherheit & Hinweise für Produktion](#sicherheit--hinweise-für-produktion)
- [Tests & Qualitätssicherung](#tests--qualitätssicherung)
- [Troubleshooting](#troubleshooting)
- [Roadmap-Ideen](#roadmap-ideen)
- [Lizenz](#lizenz)

## Projektüberblick

**PDF Vi3wer** ist eine kleine, schnelle Web-App zum Verwalten und Lesen von PDF-Dateien:

- PDFs per Drag & Drop oder Dateiauswahl hochladen
- automatische Cover-Vorschau (Thumbnail) aus Seite 1 erzeugen
- PDFs in einem visuellen Bücherregal darstellen
- in Supabase Storage speichern und als Metadaten in einer Tabelle verwalten
- PDFs direkt im Browser mit Zoom und Seitennavigation lesen

Die Anwendung ist aktuell auf einfache Nutzung ohne Login ausgelegt (öffentliche Policies in Supabase).

## Features

### Bücherregal / Library

- Grid-Ansicht mit PDF-Cards
- „Hinzufügen“-Tile und Drag-&-Drop auf der gesamten Seite
- Upload mit optimistischem UI-Verhalten
- Löschen einzelner Einträge (Storage + Datenbank)
- Anzeige von Dateiname und Dateigröße

### PDF-Rendering

- Rendering mit `pdf.js` (über CDN eingebunden)
- Mehrseitige Darstellung als Scroll-Ansicht
- Aktuelle Seite wird aus der Scrollposition ermittelt
- Zoom-In/Zoom-Out mit Grenzen (25% bis 400%)
- Gespeicherter Zoom-Faktor via Cookie
- Auto-Fit-Modus beim Öffnen (wenn kein gespeicherter Zoom vorhanden)

### Cloud-Anbindung

- Upload in Supabase Storage Bucket `pdfs`
- Metadaten in `public.pdf_library`
- öffentliche URL pro Datei
- Download aus Storage in ein `File`-Objekt zum Anzeigen

## Technischer Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Routing:** React Router
- **State/Data:** React State + TanStack Query (Provider vorhanden)
- **Backend as a Service:** Supabase (Storage + Postgres)
- **Tests:** Vitest + Testing Library (Basis-Setup)

## Architektur auf einen Blick

1. Startseite lädt alle vorhandenen PDF-Metadaten aus Supabase.
2. Beim Upload wird lokal sofort ein temporärer Eintrag erzeugt.
3. Parallel wird ein Thumbnail aus der ersten PDF-Seite generiert.
4. Datei wird in Supabase Storage hochgeladen.
5. Metadaten (`id`, `name`, `size`, `storage_path`, `thumbnail`) werden in `pdf_library` gespeichert.
6. Beim Öffnen eines Eintrags wird die Datei bei Bedarf aus Storage geladen und im Viewer gerendert.

## Voraussetzungen

- **Node.js** 18+ (empfohlen: aktuelle LTS)
- **npm** 9+
- Ein **Supabase-Projekt** (URL + Publishable Key)

## Schnellstart (lokal)

```bash
# 1) Repository klonen
git clone <DEIN_REPO_URL>
cd pdf-vi3wer

# 2) Abhängigkeiten installieren
npm install

# 3) .env anlegen (siehe Abschnitt "Umgebungsvariablen")
cp .env.example .env   # falls vorhanden

# 4) Dev-Server starten
npm run dev
```

Danach ist die App standardmäßig unter `http://localhost:5173` erreichbar.

## Supabase einrichten

### 1) Projekt erstellen

Erstelle in Supabase ein neues Projekt.

### 2) Migration anwenden

Im Repository liegt eine SQL-Migration für Bucket, Policies und Tabelle:

- `supabase/migrations/20260220104046_2f03f07a-cc1f-4fbc-a927-aaeb255f3339.sql`

Du kannst sie z. B. über Supabase SQL Editor ausführen oder via Supabase CLI migrieren.

### 3) Bucket & Tabelle prüfen

Nach erfolgreicher Migration sollten vorhanden sein:

- Storage Bucket: `pdfs` (public, 50 MB Limit)
- Tabelle: `public.pdf_library`
- RLS Policies für öffentliche Lese-/Schreibzugriffe

## Umgebungsvariablen

Erstelle eine `.env` im Projektroot:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
```

> Wichtig: Ohne diese Variablen kann der Supabase-Client nicht initialisiert werden.

## Verfügbare Skripte

```bash
npm run dev         # Entwicklungsserver
npm run build       # Produktionsbuild
npm run build:dev   # Build im Development-Mode
npm run preview     # Build lokal previewen
npm run lint        # ESLint ausführen
npm run test        # Vitest (einmalig)
npm run test:watch  # Vitest im Watch-Mode
```

## Projektstruktur

```text
src/
  components/
    Bookshelf.tsx        # Bücherregal + Thumbnail-Generierung
    PdfViewer.tsx        # PDF-Viewer mit Zoom/Scroll-Logik
  integrations/supabase/
    client.ts            # Supabase Client (env-basiert)
    types.ts             # generierte DB-Typen
  lib/
    pdfStorage.ts        # Upload, Download, Delete, List, URL
  pages/
    Index.tsx            # Hauptseite / App-Flow

supabase/
  migrations/            # SQL-Migrationen (Bucket, Tabelle, Policies)
```

## Wie die App funktioniert

### Upload

- Nutzer wählt eine oder mehrere PDFs.
- Nur Dateien mit MIME-Typ `application/pdf` werden akzeptiert.
- Ein temporärer Eintrag erscheint sofort in der UI.
- Nach erfolgreichem Upload wird der temporäre Eintrag ersetzt.

### Öffnen

- Falls die Datei schon lokal im State liegt: direkt anzeigen.
- Falls nicht: aus Supabase Storage herunterladen.
- Datei wird im Viewer aufbereitet und seitenweise gerendert.

### Löschen

- Objekt im Storage wird entfernt.
- Zugehöriger Datenbankeintrag wird gelöscht.

## Sicherheit & Hinweise für Produktion

Die aktuelle Migration erlaubt **öffentlichen Upload/Read/Delete ohne Auth**. Das ist praktisch für schnelle Prototypen, aber in Produktion meist zu offen.

Empfehlungen für Produktion:

- Supabase Auth aktivieren
- Policies auf `auth.uid()` einschränken
- Dateigröße und Rate Limiting sauber begrenzen
- Optional: private Buckets + signierte URLs
- Serverseitige Validierung und Audit Logging ergänzen

## Tests & Qualitätssicherung

- Unit-/Komponententests laufen mit Vitest.
- Linting via ESLint.
- Für UI-Regressionen empfiehlt sich ergänzend visuelles Testing (z. B. Playwright Screenshots in CI).

## Troubleshooting

### `pdfjsLib` nicht verfügbar

- Prüfe, ob das CDN-Script in `index.html` geladen wird.
- Prüfe Adblocker/CSP-Regeln, die CDN-Requests blockieren könnten.

### Supabase-Fehler beim Upload

- Stimmt `VITE_SUPABASE_URL`?
- Ist der Publishable Key korrekt?
- Existiert Bucket `pdfs`?
- Wurde die Migration vollständig ausgeführt?

### CORS-/Policy-Probleme

- Prüfe Storage-Policies und RLS-Policies.
- Prüfe, ob die Requests gegen das richtige Supabase-Projekt laufen.

## Roadmap-Ideen

- Benutzerkonten mit persönlicher Bibliothek
- Volltextsuche über PDFs
- Favoriten, Tags, Ordner
- Annotationen und Markierungen
- Offline-Modus mit IndexedDB
- Teilen via signierter Links

## Lizenz

Dieses Projekt steht unter der **GNU General Public License v3.0 (oder neuer)**.

Details findest du in der Datei [`LICENSE`](./LICENSE).
