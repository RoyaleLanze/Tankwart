<!-- Quelle: Design-System-Artifact https://claude.ai/artifact/Unt5QgUmbjiLEz5nRNeCce (Stand 17.11.2026). Bei Widerspruch gelten docs/requirements.md und die ADRs. -->

# Tankwart Design-System

Das Design System der Tankwart-App: eine Android-App (Material Design 3, React Native/Expo) zum Erfassen von Betankungen, Auswerten von Verbrauch und Kosten und Finden günstiger Tankstellen inkl. Umweg. Grundlage sind die Stitch-Mockups des Teams (Stand 04.11.2026) mit ihrer Indigo-Palette, Manrope für Zahlen und Überschriften und Inter für Text.

## Charakter

Ruhig, präzise, vertrauenswürdig – eher Finanz-App als Autoblog. Jede Ansicht beantwortet eine Frage auf einen Blick („Wie viel verbrauche ich?“, „Wo lohnt sich Tanken gerade?“) und lässt sich mit einer Hand bedienen. Zahlen stehen im Mittelpunkt, Dekoration tritt zurück.

## Sprache und Inhalte

- Deutsch, Du-Form, kurze Sätze: „Erfasse deine erste Betankung“, nicht „Bitte erfassen Sie…“.
- Feste Begriffe (Glossar der Anforderungen): **Betankung** (nicht Tankung/Tankprotokoll), **Vollbetankung / Teilbetankung**, **Intervall**, **nicht gewertet**, **aktives Fahrzeug**.
- Zahlen im deutschen Format mit Einheit: „6,4 L/100 km“, „84.230 km“, „1,74⁹ €/L“, „182,40 €“.
- Live-Preise mit Abrufzeit: „abgerufen um 09:52“ – nie „vor 12 Min. aktualisiert“ (die Preisquelle liefert keinen Änderungszeitpunkt).
- Quellenangabe unter jeder Preisliste: „Preisdaten: Tankerkönig.de / MTS-K (CC BY 4.0)“.
- Keine internen Kennungen im UI: keine Screen-Nummern („7.11“), keine Anforderungs-IDs („[N-12]“), keine Komponentennamen („Tonal“), kein „Telemetrie“.

## Farbe

Die Marke ist **Indigo** (`primary` #4338CA) auf ruhigen Slate-Neutraltönen (`background` #F8FAFC, `surface` #FFFFFF, `on-surface` #0F172A).

- `primary`: Hauptaktionen, FAB, aktive Chips, Diagramme. `primary-container` (#E0E7FF) für tonale Flächen: Hero-Karte, Navigation-Indikator, Monatsköpfe, Info-Zeilen.
- `accent` Amber (#F59E0B) nur als **Fläche** mit dunklem Text: Labels „Günstigste“ und „Lohnt sich am meisten“, Spitzenwert im Diagramm.
- `price` (#B45309) ist die einzige Textfarbe für Literpreise.
- Status: `success`/`warning` (#16A34A, #D97706) aus den Mockups sind für Icons, Pfeile und Punkte gedacht; als Textfarbe erreichen sie auf Weiß nur ~3,2:1. Text setzt `success-strong` (#15803D) bzw. `warning-strong` (#C2410C); Badges nutzen die `*-container`-Paare.
- `error` (#DC2626) nur für Fehler und Löschen.
- Farbe trägt nie allein Bedeutung: Über/unter Ø, Geöffnet/Geschlossen und Ersparnis haben immer Pfeil oder Text.
- Dunkelmodus (N-13) ist als zweites Theme hinterlegt.

## Typografie

- **Manrope** (`--font-display`) für Kennzahlen, Preise, Überschriften und Listentitel – mit tabellarischen Ziffern, damit Beträge untereinander ruhig stehen.
- **Inter** (`--font-sans`) für Fließtext, Labels, Buttons und Formularwerte.
- `display-value` 44/52 für die eine große Kennzahl der Hero-Karte, `price-lg` 28/34 für Literpreise, `kpi-value` 22/28 für Kacheln.
- Kleinste Größe 12 px (`label-sm`); Schrift skaliert mit der Systemschriftgröße.

## Layout

- 4-dp-Raster; Seitenrand `space-4` (16 dp), Abstand zwischen Karten `space-3`, zwischen Abschnitten `space-6`.
- Hochformat 412 × 915, einspaltig. Wichtigstes oben: Kennzahl, dann KPIs, dann Listen.
- Hauptscreens: Top App Bar (64 dp) + Inhalt + Navigation Bar (80 dp); Listen mit 88 dp Innenabstand unten, damit der Extended FAB nichts verdeckt.
- Formulare: große Felder, fixierter Speichern-Button unten, eine Top App Bar mit genau einem Titel.
- Touch-Ziele mindestens 48 × 48 dp (`touch-min`).

## Form und Tiefe

- Radien: Karten `radius-lg` (16), Hero und Bottom Sheet `radius-xl` (28), KPI-Kacheln `radius-md` (12), Chips `radius-sm` (8), Textfelder `radius-xs` (4), Buttons und Badges `radius-full`.
- Hierarchie über Tonwerte (surface, surface-variant, primary-container), Schatten nur dezent: `elevation-1` für Karten, `elevation-3` für FAB, Sheets und Dialoge. Keine Verläufe.

## Ikonografie

Material Symbols Rounded, 24 dp, Strichstärke 400; gefüllt (`FILL 1`) nur für das aktive Navigationsziel und Sterne. Kernsymbole: `local_gas_station` (Betankung, Tankstelle), `directions_car` (Fahrzeug), `speed` (Kilometerstand), `receipt_long` (Verlauf), `monitoring` (Statistik), `south`/`north` (unter/über Ø, Ersparnis/teurer), `schedule` (Öffnungszeit), `my_location` (Standort). Keine Marken-Logos von Tankstellenketten, keine Fotos.

## Komponenten

Die Vorschauen nutzen `components/bundle.css` (Klassen mit Präfix `tw-`): Button, ExtendedFab, Badge, Chip, KpiTile, PriceTag, TextField, NavigationBar, TopAppBar, StationCard, EntryListItem. In der App werden sie mit react-native-paper (M3) umgesetzt; die Tokens sind die gemeinsame Quelle.

## Do / Don't

**Do:** eine dominante Kennzahl oder Aktion pro Screen · Lade-, Leer- und Fehlerzustände mitgestalten · Verbrauch immer mit „L/100 km“ · Preise mit hochgestellter dritter Stelle und Screenreader-Label.

**Don't:** Amber als Text auf hell · Avatar- oder Logo-Bilder in der Top App Bar · abgeschnittene Chip-Reihen · doppelte Kopfzeilen · NICE-TO-HAVE-Funktionen als feste Bestandteile von MUST-Screens darstellen · Statusfarben ohne Icon oder Text.

## Herkunft

Abgeleitet aus den Stitch-Mockups 7.1–7.11 (Tailwind-Konfiguration von 7.3 Home als Referenzpalette) und der Projekt-`DESIGN.md`. Bewusste Abweichung vom ersten Entwurf: Indigo statt Petrol als Markenfarbe. Ergänzt wurden kontraststarke Textvarianten für Status (`success-strong`, `warning-strong`), `outline-strong` für Bedienelement-Rahmen und das Dunkel-Theme.

# Komponenten-Richtlinien

## TopAppBar
Top App Bar, 64 dp, auf `surface`.

- **Hauptscreens:** links der Fahrzeugwechsler (Chip mit Auto-Icon, Name, Dropdown; Menü endet mit „Fahrzeuge verwalten“ und „Fahrzeug hinzufügen“), rechts nur das Zahnrad zu den Einstellungen.
- **Unterseiten:** Zurück- bzw. Schließen-Icon und Titel; genau ein Titel pro Screen.
- Kein Logo-Bild, kein Avatar-Button (Konto liegt in den Einstellungen), keine Platzhalter-Bilder.

## NavigationBar
M3 Navigation Bar, 80 dp, immer in dieser Reihenfolge: Home · Verlauf · Statistik · Tankstellen.

- Aktives Ziel: gefülltes Icon in einer 64 × 32 dp Pill aus `primary-container`.
- Labels immer sichtbar; keine fünfte Position, kein „Übersicht“ statt „Home“ (Mockup 7.7 Indigo-Variante weicht ab).
- Nur auf den vier Hauptscreens; Formulare und Details haben Zurück/Schließen in der Top App Bar.

## ExtendedFab
Extended FAB „Betankung erfassen“ unten rechts auf Home und Verlauf, 16 dp über der Navigation Bar.

- Label immer ausgeschrieben, nie nur „Tanken“.
- Listen bekommen unten 88 dp Innenabstand, damit der FAB keinen Inhalt verdeckt (Mockups Verlauf, Statistik, Tankstellen).
- Nicht auf Statistik, Tankstellen, Formularen und Detail-Screens.

## Button
Material-3-Buttons in Pill-Form, mindestens 48 dp hoch.

- **Filled** (`tw-btn--filled`, `primary`): genau eine Hauptaktion pro Screen – „Speichern“, „Anmelden“, „Hier tanken“.
- **Tonal** (`primary-container`): sekundäre, häufige Aktionen – „Preise laden“, „Als aktiv setzen“.
- **Outlined**: gleichwertige Alternativen – „Ort suchen“, „Navigation“.
- **Text**: Inline-Aktionen in Karten – „Ändern“, „Verwerfen“.
- **Gefahr** (`error-container`): „Löschen“; öffnet immer einen Bestätigungsdialog.
- Deaktiviert: 38 % Deckkraft, bis Pflichtfelder gültig sind.

Labels sind Verben im Infinitiv, ohne Pfeil-Icons am Ende.

## TextField
Outlined Text Field (M3) mit Label über dem Feld, 56 dp hoch, Rahmen `outline-strong`.

- Zahlenfelder: Zifferntastatur, Einheit rechts im Feld, Komma und Punkt erlaubt.
- Berechnetes Feld (Liter/€/L/Gesamt): `surface-variant`, ohne Rahmen, Einheit ersetzt durch „berechnet“.
- Fehler: 2 dp Rahmen `error`, Text darunter in `error`; Warnungen (P-03) als Hilfetext in `warning-strong`.
- Jedes Feld hat ein sichtbares Label – Platzhaltertext ersetzt kein Label (Mockup 7.1: E-Mail-Feld ohne Eingabebox).

## Chip
Filter-Chips für Kraftstoff, Radius und Sortierung; 32 dp hoch, Touch-Fläche 48 dp.

- Ausgewählt: `primary-container` + Häkchen-Icon. Nicht ausgewählt: Kontur `outline-strong`.
- Chip-Reihen dürfen nicht abgeschnitten werden: umbrechen oder horizontal scrollbar mit sichtbarem Anschnitt am rechten Rand (Mockup 7.4 schneidet „Diesel“ ab, 7.8 den Radius).
- Kraftstoffliste immer vollständig: Super E5, Super E10, Diesel (nur die Sorten von Tankerkönig, Entscheidung vom 17.11.2026).

## Badge
Kleine Pill-Labels für Zustände; Farbe trägt nie allein die Bedeutung.

- **success-container**: „Geöffnet“, Verbrauch unter Ø (mit ↓).
- **warning-container**: Verbrauch über Ø (mit ↑), „½ Teilbetankung“.
- **accent** (Amber-Fläche, dunkler Text): „Günstigste“, „Lohnt sich am meisten“ – höchstens ein Badge je Art pro Liste.
- **neutral**: „Geschlossen“, „nicht gewertet“, „Referenz“.
- Verbrauchswerte immer mit Einheit („6,1 L/100 km“, nicht „6,1 L“).

## KpiTile
Kennzahl-Kachel auf `surface-variant`: Label oben (label-sm), Wert darunter (kpi-value, Manrope, tabellarische Ziffern), Einheit kleiner.

- Reihe mit drei Kacheln auf Home, 2 × 2-Raster auf Statistik.
- Labels in `on-surface` (auf surface-variant reicht on-surface-variant nicht für 4,5:1).
- Zeitraum gehört ins Label („Kosten (Nov.)“), nicht in einen Untertitel.

## PriceTag
Literpreis wie an der Preistafel: „1,74⁹ €“ in `price` (dunkles Amber), Manrope 700, dritte Nachkommastelle hochgestellt mit 60 % Größe.

- Immer mit `accessibilityLabel` „1 Euro 74,9 Cent pro Liter“.
- Darunter optional die Ersparnis-Zeile (N-08): `success-strong` + ↓ „spart … inkl. Umweg“, `warning-strong` + ↑ „… teurer“, neutral „Referenz · nächste Tankstelle“.
- Nur auf `surface` oder `background`, nie auf `surface-variant`.

## StationCard
Karte einer Tankstelle in der Umkreisliste (7.8) und auf Home (N-02).

- Links: optionales Label (Amber), Name, Adresse · Entfernung. Rechts: PriceTag.
- Fußzeile: Geöffnet/Geschlossen-Badge und, bei Sortierung „Ersparnis“, die Ersparnis-Zeile.
- Die Kostenaufschlüsselung (Tanken/Anfahrt/Gesamt) gehört ins Tankstellen-Detail, nicht in die Liste.
- Ganze Karte antippbar → Tankstellen-Detail.

## EntryListItem
Zeile einer Betankung im Verlauf (7.5), mindestens 72 dp hoch.

- Links Icon-Avatar, Mitte Tankstelle + Datum · Liter · €/L, rechts Betrag und Verbrauchs-Badge mit Einheit.
- Teilbetankung: Badge „½ Teilbetankung“ statt Verbrauch; nicht gewertete Intervalle: „nicht gewertet“.
- Monatsköpfe darüber auf `primary-container`: „November 2026 · 3 Betankungen · 182,40 €“ in einer Zeile.
