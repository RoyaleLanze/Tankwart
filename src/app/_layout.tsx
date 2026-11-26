import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";

import { AppBar } from "@/components/AppBar";
import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSession } from "@/features/auth/hooks/useSession";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { LOAD_ERROR_TEXT } from "@/features/vehicles/messages";
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

// Cache for all server data (ADR 0008), shared by every screen. No retries here: supabase-js
// already retries a failed GET three times (1, 2 and 4 s). With TanStack's own three retries
// on top, the error state took 35 s to appear when offline.
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

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
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

function RootNavigator({ isSignedIn }: { isSignedIn: boolean }) {
  const queryClient = useQueryClient();
  const vehicles = useVehicles({ enabled: isSignedIn });
  const { signOut, error: signOutError } = useSignOut();

  // The cache holds the data of the signed-in user. The next user must not see it.
  useEffect(() => {
    if (!isSignedIn) queryClient.clear();
  }, [isSignedIn, queryClient]);

  // Like the session, the vehicles decide which screens are reachable, so the navigator waits
  // for them. Otherwise the onboarding would flash up on every start.
  if (isSignedIn && vehicles.data === undefined) {
    // Retrying shows the loading screen again: TanStack resets the error while it fetches.
    // Signing out is the way out when loading keeps failing (M14). Its own rare error, if any,
    // replaces the message so it is not lost.
    return vehicles.isError ? (
      <ErrorScreen
        message={signOutError ?? LOAD_ERROR_TEXT}
        onRetry={() => vehicles.refetch()}
        secondaryAction={{ label: "Abmelden", onPress: signOut }}
      />
    ) : (
      <LoadingScreen label="Fahrzeuge werden geladen …" />
    );
  }
  const hasVehicle = (vehicles.data?.length ?? 0) > 0;

  return (
    <Stack
      screenOptions={{
        header: ({ navigation, options, back }) => (
          <AppBar title={options.title ?? ""} onBack={back ? navigation.goBack : undefined} />
        ),
      }}
    >
      {/* Auth guard (M14): a screen is reachable only while its guard is true. When the session
          or the vehicles change, Expo Router moves to the first reachable screen by itself. */}
      <Stack.Protected guard={isSignedIn && hasVehicle}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Einstellungen" }} />
        <Stack.Screen name="vehicles/index" options={{ title: "Fahrzeuge" }} />
        <Stack.Screen name="vehicles/new" options={{ title: "Fahrzeug hinzufügen" }} />
        <Stack.Screen name="vehicles/[id]" options={{ title: "Fahrzeug bearbeiten" }} />
      </Stack.Protected>
      {/* Without a vehicle the app leads straight to adding one (M1). */}
      <Stack.Protected guard={isSignedIn && !hasVehicle}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
