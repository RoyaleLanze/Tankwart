import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { AppBar } from "@/components/AppBar";
import { darkTheme, lightTheme, type AppTheme } from "@/lib/theme";

// Gives the navigation containers (screen backgrounds, headers) the same colors as Paper.
function navigationTheme(theme: AppTheme, base: typeof DefaultTheme): typeof DefaultTheme {
  const { colors } = theme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
      notification: colors.error,
    },
  };
}

const navigationThemes = {
  light: navigationTheme(lightTheme, DefaultTheme),
  dark: navigationTheme(darkTheme, DarkTheme),
};

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <ThemeProvider value={isDark ? navigationThemes.dark : navigationThemes.light}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            header: ({ navigation, options, back }) => (
              <AppBar title={options.title ?? ""} onBack={back ? navigation.goBack : undefined} />
            ),
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: "Einstellungen" }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
