import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { AppBar } from "@/components/AppBar";
import { LoadingScreen } from "@/components/LoadingScreen";
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

// Longest time the splash may cover the start. Restoring an expired session offline takes about
// 25 s of retries in supabase-js; after this time the user sees a loading message instead.
const MAX_SPLASH_MS = 2000;

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";
  const { session, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
      return;
    }
    const timer = setTimeout(SplashScreen.hide, MAX_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <ThemeProvider value={isDark ? navigationThemes.dark : navigationThemes.light}>
        <StatusBar style="auto" />
        {/* The navigator waits for the session. Otherwise the guard would show the login screen
            on every cold start and switch to the tabs while they are still mounting. */}
        {isLoading ? (
          <LoadingScreen label="Anmeldung wird geprüft …" />
        ) : (
          <RootNavigator isSignedIn={session !== null} />
        )}
      </ThemeProvider>
    </PaperProvider>
  );
}

function RootNavigator({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <Stack
      screenOptions={{
        header: ({ navigation, options, back }) => (
          <AppBar title={options.title ?? ""} onBack={back ? navigation.goBack : undefined} />
        ),
      }}
    >
      {/* Auth guard (M14): a screen is reachable only while its guard is true. When the session
          changes, Expo Router moves to the first reachable screen by itself. */}
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Einstellungen" }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
