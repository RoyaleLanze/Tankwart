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
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) throw new Error(`Token value is not a number: ${value}`);
  return number;
}

// JSON imports type token names as plain strings, so the names are listed here to make
// typos a type error. The values still come only from tokens.json, and both lists must
// match exactly, so a token added to the JSON fails at startup until it is listed here.
function scale<const Name extends string>(
  group: { tokens: { name: string; value: string }[] },
  names: readonly Name[],
): (name: Name) => number {
  const listed: readonly string[] = names;
  const jsonNames = group.tokens.map((t) => t.name);
  const mismatch = [
    ...jsonNames.filter((n) => !listed.includes(n)),
    ...listed.filter((n) => !jsonNames.includes(n)),
  ];
  if (mismatch.length > 0) throw new Error(`Scale tokens out of sync: ${mismatch.join(", ")}`);

  const values = new Map(group.tokens.map((t) => [t.name, px(t.value)]));
  return (name) => {
    const value = values.get(name);
    if (value === undefined) throw new Error(`Unknown scale token: ${name}`);
    return value;
  };
}

/** Spacing, radii and component sizes in dp, e.g. `spacing("space-4")` = 16. */
export const spacing = scale(tokens.spacing, [
  "space-1",
  "space-2",
  "space-3",
  "space-4",
  "space-6",
  "space-8",
]);
export const radius = scale(tokens.radius, [
  "radius-xs",
  "radius-sm",
  "radius-md",
  "radius-lg",
  "radius-xl",
  "radius-full",
]);
export const sizes = scale(tokens.size, ["touch-min", "top-app-bar", "navigation-bar", "fab"]);

/** Material 3 standard icon size in dp. */
export const ICON_SIZE = 24;

// Family names and weights as embedded by the expo-font plugin in app.json.
const FONT_FAMILIES: Record<string, string> = { display: "Manrope", sans: "Inter" };
const FONT_WEIGHTS: Record<number, FontStyle["fontWeight"]> = {
  400: "400",
  600: "600",
  700: "700",
};

function lookup<T>(table: Record<string | number, T>, key: string | number, kind: string): T {
  const value = table[key];
  if (value === undefined) throw new Error(`Unsupported ${kind}: ${key}`);
  return value;
}

/** Text style of a type token from tokens.json, e.g. `typeStyle("price-lg")`. */
export function typeStyle(name: string): FontStyle {
  for (const group of tokens.type.groups) {
    const style = group.styles.find((s) => s.name === name);
    if (style) {
      return {
        fontFamily: lookup(FONT_FAMILIES, group.family, "font family"),
        fontWeight: lookup(FONT_WEIGHTS, style.fontWeight, "font weight"),
        fontSize: px(style.fontSize),
        lineHeight: px(style.lineHeight),
        letterSpacing: style.letterSpacing ? px(style.letterSpacing) : 0,
      };
    }
  }
  throw new Error(`Unknown type token: ${name}`);
}

// Inter for every Paper variant, then the variants the design defines explicitly.
// Every variant Paper renders with weight 500 is mapped too, because only 400, 600 and 700 are embedded.
const baseFonts = configureFonts({ config: { fontFamily: FONT_FAMILIES.sans } });
const fonts = {
  ...baseFonts,
  displayMedium: typeStyle("display-value"),
  headlineMedium: typeStyle("headline-md"),
  titleLarge: typeStyle("title-lg"),
  titleMedium: typeStyle("title-md"),
  titleSmall: typeStyle("label-lg"),
  bodyLarge: typeStyle("body-lg"),
  bodyMedium: typeStyle("body-md"),
  labelLarge: typeStyle("label-lg"),
  labelMedium: typeStyle("label-sm"),
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
      // Replace Paper's purple baseline tints (navigation bar, menus, snackbars) with token colors.
      elevation: {
        level0: "transparent",
        level1: c("surface"),
        level2: c("surface"),
        level3: c("surface"),
        level4: c("surface"),
        level5: c("surface"),
      },
      inverseSurface: c("on-surface"),
      inverseOnSurface: c("surface"),
      inversePrimary: c("primary-container"),
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
