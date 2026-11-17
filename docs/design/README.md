# Design

- **Mockups (12 Screens, klickbarer Canvas):** https://claude.ai/artifact/TJXW1VMMUer5n2VUarphD6
- **Design-System Tankwart:** https://claude.ai/artifact/Unt5QgUmbjiLEz5nRNeCce
- **Regeln und Komponenten:** [`design-system.md`](design-system.md) (Sprache, Farbe, Typografie, Layout, Komponenten-Richtlinien)
- **Tokens:** [`tokens.json`](tokens.json) (Farben hell/dunkel, Abstände, Radien, Typografie). Quelle für das react-native-paper-Theme in `src/lib/theme.ts`.

## Kernpunkte

- Markenfarbe Indigo `#4338CA` (primary). Amber (`accent`) nur als Fläche, nie als Text auf hellem Grund.
- Preise in `price` `#B45309`, mit hochgestellter dritter Nachkommastelle (1,74⁹ €).
- Schriften: **Manrope** für Zahlen und Titel (tabular-nums), **Inter** für Text.
- Abstände 4/8/12/16/24/32, Touch-Ziel min. 48 dp, Top-App-Bar 64, Navigation-Bar 80, FAB 56.
- Navigation: Bottom-Navigation mit Home · Verlauf · Statistik · Tankstellen, Extended FAB „Betankung erfassen“, Fahrzeugwahl als Dropdown in der Kopfzeile.
- Die Mockup-Daten sind Beispieldaten.
