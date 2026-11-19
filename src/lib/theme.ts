// Paper themes built from docs/design/tokens.json, the single source for design values (ADR 0013).
import {
  configureFonts,
  MD3DarkTheme,
  MD3LightTheme,
  useTheme,
  type MD3Theme,
} from "react-native-paper";

import tokens from "../../docs/design/tokens.json";

type Mode = "light" | "dark";
type FontStyle = MD3Theme["fonts"]["bodyLarge"];

function color(name: string, mode: Mode): string {
  const token = tokens.color.tokens.find((t) => t.name === name);
  if (!token) throw new Error(`Unknown color token: ${name}`);
  return token.value[mode];
}

function px(value: string): number {
  return Number.parseFloat(value);
}

function scale(group: { tokens: { name: string; value: string }[] }): Record<string, number> {
  return Object.fromEntries(group.tokens.map((t) => [t.name, px(t.value)]));
}

/** Spacing, radii and component sizes in dp, e.g. `spacing["space-4"]` = 16. */
export const spacing = scale(tokens.spacing);
export const radius = scale(tokens.radius);
export const sizes = scale(tokens.size);

// Family names as embedded by the expo-font plugin in app.json.
const FONT_FAMILIES = { display: "Manrope", sans: "Inter" } as const;
const FONT_WEIGHTS: Record<number, FontStyle["fontWeight"]> = {
  400: "400",
  600: "600",
  700: "700",
};

function typeStyle(name: string): FontStyle {
  for (const group of tokens.type.groups) {
    const style = group.styles.find((s) => s.name === name);
    if (style) {
      return {
        fontFamily: FONT_FAMILIES[group.family as keyof typeof FONT_FAMILIES],
        fontWeight: FONT_WEIGHTS[style.fontWeight],
        fontSize: px(style.fontSize),
        lineHeight: px(style.lineHeight),
        letterSpacing: style.letterSpacing ? px(style.letterSpacing) : 0,
      };
    }
  }
  throw new Error(`Unknown type token: ${name}`);
}

// Inter for every Paper variant, then the variants the design defines explicitly.
const baseFonts = configureFonts({ config: { fontFamily: FONT_FAMILIES.sans } });
const fonts = {
  ...baseFonts,
  displayMedium: typeStyle("display-value"),
  headlineMedium: typeStyle("headline-md"),
  titleLarge: typeStyle("title-lg"),
  titleMedium: typeStyle("title-md"),
  bodyLarge: typeStyle("body-lg"),
  bodyMedium: typeStyle("body-md"),
  labelLarge: typeStyle("label-lg"),
  labelSmall: typeStyle("label-sm"),
};

function buildTheme(mode: Mode) {
  const base = mode === "light" ? MD3LightTheme : MD3DarkTheme;
  const c = (name: string) => color(name, mode);
  return {
    ...base,
    fonts,
    colors: {
      ...base.colors,
      primary: c("primary"),
      onPrimary: c("on-primary"),
      primaryContainer: c("primary-container"),
      onPrimaryContainer: c("on-primary-container"),
      // Paper uses secondaryContainer for the active navigation indicator; the design wants primary-container.
      secondary: c("primary"),
      onSecondary: c("on-primary"),
      secondaryContainer: c("primary-container"),
      onSecondaryContainer: c("on-primary-container"),
      tertiary: c("accent"),
      onTertiary: c("on-accent"),
      tertiaryContainer: c("accent"),
      onTertiaryContainer: c("on-accent"),
      background: c("background"),
      onBackground: c("on-surface"),
      surface: c("surface"),
      onSurface: c("on-surface"),
      surfaceVariant: c("surface-variant"),
      onSurfaceVariant: c("on-surface-variant"),
      outline: c("outline-strong"),
      outlineVariant: c("outline"),
      error: c("error"),
      onError: c("on-error"),
      errorContainer: c("error-container"),
      onErrorContainer: c("on-error-container"),
      scrim: c("scrim"),
      backdrop: c("scrim"),
      // App-specific colors beyond Material 3.
      accent: c("accent"),
      onAccent: c("on-accent"),
      price: c("price"),
      success: c("success"),
      successStrong: c("success-strong"),
      successContainer: c("success-container"),
      onSuccessContainer: c("on-success-container"),
      warning: c("warning"),
      warningStrong: c("warning-strong"),
      warningContainer: c("warning-container"),
      onWarningContainer: c("on-warning-container"),
    },
  };
}

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");
export type AppTheme = typeof lightTheme;

/** Typed access to the theme, including the app-specific colors. */
export const useAppTheme = () => useTheme<AppTheme>();
