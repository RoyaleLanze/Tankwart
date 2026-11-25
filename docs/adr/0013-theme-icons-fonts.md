# 0013 – Theme, Icons und Schriften

- **Status:** Accepted
- **Datum:** 2026-11-19
- **Entscheider:** @SealJonny

## Kontext

Issue #4 baut das react-native-paper-Theme (ADR 0004) aus `docs/design/tokens.json`. Das Design nennt Material Symbols Rounded als Icons und Manrope/Inter als Schriften. Paper bringt eigene Icons mit, und die Tokens enthalten ein helles und ein dunkles Theme. Der Dunkelmodus steht in den Anforderungen unter NICE-TO-HAVE.

## Optionen und Empfehlung je Frage

| Frage | Optionen | Empfehlung |
|---|---|---|
| Icons | MaterialCommunityIcons (`@expo/vector-icons`, Paper-Standard) · Material Symbols Rounded | MaterialCommunityIcons. Keine eigene Icon-Schrift, alle Kernsymbole gibt es gefüllt (aktives Ziel) und als Kontur. Weicht optisch leicht von den Mockups ab. |
| Schriften | beim Build einbetten (`expo-font`-Plugin) · zur Laufzeit mit `useFonts()` laden | Einbetten. Die Dateien kommen aus `@expo-google-fonts/manrope` und `@expo-google-fonts/inter`, das Plugin in `app.json` bettet sie nativ ein. Kein Ladezustand im Code, nach Änderungen ist ein neuer Build nötig. |
| Dunkelmodus | nur hell · hell und dunkel | Nur hell, weil NICE-TO-HAVE. |
| Top App Bar bis #10 | Titel des Tabs + Zahnrad · nur Zahnrad | Titel + Zahnrad zu einem Platzhalter „Einstellungen“. #10 ersetzt den Titel durch den Fahrzeugwechsler. |

## Entscheidung

Wie empfohlen, mit einer Abweichung: **Hell und Dunkel** werden beide gebaut. Die App folgt der Systemeinstellung (`userInterfaceStyle: automatic`). Gewählt von @SealJonny am 19.11.2026.

Neue Abhängigkeiten: `react-native-paper` (ADR 0004), `@expo/vector-icons`, `@expo-google-fonts/manrope`, `@expo-google-fonts/inter`.

## Konsequenzen

- Das Theme liest die Werte direkt aus `tokens.json`. Die Tokens bleiben so die einzige Quelle, auch für das dunkle Theme.
- Der Dunkelmodus wird vor den übrigen MUST-HAVEs gebaut. Ab jetzt muss jeder Screen in beiden Modi lesbar sein und auf dem Emulator in beiden geprüft werden.
- Im Übergabegespräch erklären können: wie Paper das Theme über den Provider an alle Komponenten verteilt, und warum die Schriften eingebettet statt geladen werden.

## Ergänzung 25.11.2026: Elevation (Issue #54)

**Kontext:** Bisher waren alle Elevation-Stufen (`level1`–`level5`) auf `surface` gesetzt, damit Paper die Leisten nicht mit seinem lila Standard tönt. Dadurch heben sich Dialoge und Menüs nicht von der Fläche ab.

**Optionen:**

- Tönung aus dem eigenen `primary` (Material-3-Weg): jede Stufe ist `primary` mit fester Deckkraft über `surface`.
- Kontur (`outline`) bzw. Schatten statt Tönung.
- Eigene Elevation-Farben als Tokens in `tokens.json`.

**Entscheidung:** Tönung aus `primary`, gewählt von @SealJonny am 25.11.2026. Die Deckkräfte stammen aus Material 3 (8, 11, 12 und 14 % für Stufe 2–5). Stufe 1 bleibt `surface` (siehe Konsequenzen) und stehen als benannte Konstante in `src/lib/theme.ts`. Die Mischfarbe berechnet ein kleiner reiner Helfer (`src/lib/color.ts`, mit Jest-Test), ohne neue Abhängigkeit.

**Konsequenzen:**

- Dialoge (Stufe 3) und Menüs (Stufe 2) sind in Hell und Dunkel leicht indigo getönt und heben sich ab. Snackbars nutzen in Paper `inverseSurface` und waren schon vorher kontrastreich.
- Top App Bar und Navigation Bar bleiben laut Design reines `surface`: Die Appbar nutzt ohne `elevated` ohnehin `surface`, die Navigation Bar (sonst Stufe 2) bekommt `surface` ausdrücklich in `src/components/NavigationBar.tsx`.
- Stufe 1 bleibt ungetönt `surface`. Paper nutzt sie für `Card` (Standard `elevated`), `Surface` und `Chip elevated`. Laut Design sind Karten `surface` mit Schatten `elevation-1`, und `on-surface-variant` (4,76:1 auf `surface`) fiele auf einer getönten Karte unter 4,5:1.
- Getönt sind: `Appbar` mit `elevated`, `Menu` und die Navigation Bar (Stufe 2), `Dialog`, `Searchbar` und `FAB variant="surface"` (Stufe 3). Die Appbar bleibt deshalb ohne `elevated`, auch beim Scrollen.
- Kontrast auf getönten Flächen: Text auf Dialogen und Menüs nur in `on-surface` oder `primary` (≥ 5,8:1). `on-surface-variant` und `error` liegen auf Stufe 2–3 im hellen Modus knapp unter 4,5:1. Eine destruktive Aktion im Dialog ist deshalb ein Button mit `error-container`/`on-error-container` (Design-System), kein Text-Button in `error`. Ein `TextInput` (outlined) in einem Dialog bekommt `backgroundColor: colors.elevation.level3`, weil Paper die Lücke hinter dem Label sonst mit `background` füllt.
- Die Elevation-Farben stehen nicht in `tokens.json`, sondern werden aus `primary` und `surface` abgeleitet. Ändert sich eine der beiden Farben, ändern sich die Stufen mit.
