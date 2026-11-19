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
