import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { AppBar } from "@/components/AppBar";
import { useSession } from "@/features/auth/hooks/useSession";
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

// Keeps the splash screen visible until the stored session has been read.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";
  const { session, isLoading } = useSession();
  const isSignedIn = session !== null;

  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  // Without this, the guard would show the login screen for a moment on every cold start and then
  // switch to the tabs while they are still mounting.
  if (isLoading) return null;

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
          {/* Auth guard (M14): a screen is reachable only while its guard is true. When the
              session changes, Expo Router moves to the first reachable screen by itself. */}
          <Stack.Protected guard={isSignedIn}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: "Einstellungen" }} />
          </Stack.Protected>
          <Stack.Protected guard={!isSignedIn}>
            <Stack.Screen name="login" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
