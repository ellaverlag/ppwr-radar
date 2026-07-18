# PPWR Radar – Design-Tokens

Verbindliche Quelle: **Dashboard-Entwurf** (`stitch_ppwr_radar_dashboard/ppwr_radar_dashboard/`).
Alle Werte sind aus dessen `code.html` bzw. `screen.png` abgeleitet. Die übrigen Entwürfe liefern
nur Seitenstruktur; bei stilistischen Widersprüchen gewinnt das Dashboard.

Umsetzung: Tailwind-4-Theme in [`src/app/globals.css`](../src/app/globals.css) (`@theme`-Block).

## Farben

| Token (CSS) | Hex | Quelle im Dashboard | Verwendung |
| --- | --- | --- | --- |
| `--color-canvas` | `#ffffff` | `body` | Seiten-Canvas, Karten |
| `--color-surface` | `#f9f9f9` | Sidebar/Topbar `bg-surface` | Sidebar, Topbar, sekundäre Flächen |
| `--color-footer` | `#f3f3f3` | Footer `surface-container-low` | Seitenfooter |
| `--color-hover` | `#eeeeee` | Nav-Hover `surface-container` | Hover-Flächen |
| `--color-line` | `#e5e5e5` | `.legal-card` Border | Karten-Rahmen, Trennlinien, Timeline-Track |
| `--color-line-strong` | `#e2e2e2` | `surface-container-highest` | Innen-Trenner in Karten, Avatar-Hintergrund |
| `--color-dim` | `#dadada` | `surface-dim` | Inaktive Feed-Punkte, Skeletons |
| `--color-ink` | `#1b1b1b` | `on-surface` | Primärtext, Sekundär-Button-Border |
| `--color-ink-muted` | `#3d4944` | `on-surface-variant` | Sekundärtext, inaktive Nav |
| `--color-primary` | `#006950` | `.action-primary`, aktive Nav, `dot-green` | Aktionen, aktive Zustände, Positiv-Status |
| `--color-legal` | `#004494` | `.legal-footer`, `.role-chip` | Rechtsquellen-Fußzeilen, Links, Rollen-Chips |
| `--color-gold` | `#ffcc00` | `dot-amber`, Timeline-Marker aktiv | Kritische Marker, „ausstehend“-Punkte, Preview-Banner |
| `--color-gold-ink` | `#745b00` | `tertiary` (Theme-Config) | Text auf/neben Gold für WCAG-AA-Kontrast |
| `--color-danger` | `#ba1a1a` | `dot-red`, „3 offene Punkte“ | Fehler, kritische Zähler |
| `--color-chip-hover` | `#d8e2ff` | Role-Chip-Hover `secondary-fixed` | Hover blauer Chips |
| `--color-logo` | `#24a27f` | Logo-SVGs in `/public` | Nur Logo-Grün; nicht für UI-Aktionen verwenden |

## Typografie

Schriften: **Inter** (400/500/600/700) für alles, **JetBrains Mono** (400) für Rechtsquellen,
Daten und technische Kennungen. Labels immer 600 mit `0.05em`-Tracking, meist uppercase.

| Token | Größe/Zeile | Gewicht | Verwendung |
| --- | --- | --- | --- |
| `display` | 48/56, `-0.02em` (mobil 36/44) | 700 | Seitentitel |
| `headline` | 24/32 | 600 | Kartentitel, Markenname |
| `body-lg` | 18/30 | 400 | Einleitungen, Listentitel |
| `body` (Basis) | 16/26 | 400 | Fließtext – nie kleiner als 16 px für Lesetext |
| `body-sm` | 14/22 | 400 | Metazeilen, Fußnoten |
| `label` | 12/16, `+0.05em` | 600 | Chips, Buttons, Spaltenköpfe – uppercase |
| `mono-sm` | 13/20 (JetBrains Mono) | 400 | Rechtsquellen-Fußzeile, Daten, Versionen |

## Radius, Elevation, Abstände

- **Radius:** `4px` (`rounded`) für Karten, Buttons, Chips, Inputs. `9999px` nur für Status-Punkte
  und Avatare. (Die Prosa in DESIGN.md sagt 0 px – das Dashboard nutzt 4 px; das Dashboard gewinnt.)
- **Schatten: keine.** Tiefe entsteht ausschließlich über 1-px-Rahmen (`--color-line`) und tonale
  Flächen (`--color-surface`).
- **Raster:** 8-pt-Grid. `xs 4 / sm 8 / md 16 / lg 24 / xl 32 / xxl 48`, Gutter 24,
  Desktop-Außenabstand 64, Inhalts-Maxbreite 1200 px. Desktop-first, mobil 16 px Seitenrand.

## Komponenten-Rezepte

- **Karte („legal-card“):** weißer Grund, `1px --color-line`, Radius 4, Innenabstand 24.
  Optionale **Rechtsquellen-Fußzeile**: `border-t --color-line`, Text `mono-sm` uppercase in
  `--color-legal`, Innenabstand 16 („ART. 15 PPWR · STAND …“).
- **Primär-Button:** Fläche `--color-primary`, weißer Text, `label` uppercase mit weitem Tracking,
  Padding 24×16, Radius 4, Hover ≈ 90 % Deckkraft.
- **Sekundär-Button:** weiß, `1px --color-ink`-Rahmen, Text `--color-ink`, sonst wie Primär;
  Hover `--color-surface`.
- **Chips/Badges:** nur outlined, `label`-Typo, Padding 8×4, Radius 4.
  Grün (`--color-primary`, Fläche 5 %) = betrifft/positiv · Blau (`--color-legal`) = Rollen/Recht,
  Hover `--color-chip-hover` · Gold (Rahmen `--color-gold`, Text `--color-gold-ink`) = ausstehend/kritisch ·
  Neutral (Rahmen `--color-line-strong`, Text `--color-ink-muted`) = Info · Rot (`--color-danger`) = Fehler.
- **Status-Punkte:** 12 px Kreise in Grün/Gold/Rot (`traffic dots`).
- **Sidebar:** 256 px, Grund `--color-surface`, `1px`-Rahmen rechts. Marke: Logo + „BY PACKAGING
  JOURNAL“ als `label` uppercase. Nav-Eintrag: Icon + Text, `body` 500 in `--color-ink-muted`;
  aktiv: `--color-primary`, 700, 2-px-Balken an der Kante; Hover `--color-hover`.
- **Topbar:** 64 px hoch, Grund `--color-surface`, `1px`-Rahmen unten; rechts Chip
  (1 px `--color-line-strong`, `body-sm`) und Avatar-Kreis (`--color-line-strong`).
- **Footer:** Grund `--color-footer`, `1px`-Rahmen oben, `label`-Typo; Links `--color-ink-muted`,
  Hover unterstrichen.
- **Inputs:** weiß, `1px` Rahmen (`--color-line-strong` bzw. grau), Radius 4, Padding ≥ 12;
  Fokus: Rahmen `--color-ink`. Global gilt `:focus-visible`-Outline 2 px `--color-legal`.
- **Timeline:** 2-px-Track `--color-line`, 12-px-Marker `--color-ink`; aktiver Marker Gold mit
  weißem Innenring und 1-px-Außenring.
- **Feed-Eintrag:** linker Vertikal-Strich `--color-line-strong`, Datums-Punkt (aktiv `--color-ink`,
  sonst `--color-dim`), Datum `mono-sm`, Titel `body-lg` 700, Text `body-sm`, Chip darunter.

## Ergänzungen (nicht im Dashboard, im Geiste der Tokens ergänzt)

- **Tabs** (aus Entwurf „Meine Dokumente“): `label`/`body-sm` 600, aktiv `--color-primary` mit
  2-px-Unterstrich, inaktiv `--color-ink-muted`.
- **Tabellenkopf** (ebd.): Fläche `--color-surface`, `label` uppercase in `--color-ink-muted`.
- **Preview-Banner:** Fläche `--color-gold`, Text `--color-ink` als `label` uppercase – Funktion
  unverändert, Optik in Gold-Semantik („kritischer Hinweis“).
- **Aufklapp-Q&A (Auslegungen):** Karte wie legal-card; Frage `body-lg` 600, Antwort `body`,
  Quellen in der Rechtsquellen-Fußzeile.
- **Login-Karte:** legal-card zentriert auf `--color-surface`, Logo oben, Primär-Button.

## Barrierefreiheit

Basistext 16 px+, Kontraste AA (Grün `#006950`, Blau `#004494` und Rot `#ba1a1a` auf Weiß > 4.5:1;
Gold nie als Textfarbe, dafür `--color-gold-ink`), sichtbare Fokus-Ringe, keine Animationen außer
dezenten Hover-Übergängen.
