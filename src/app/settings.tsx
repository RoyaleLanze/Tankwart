import { StyleSheet, View } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { sizes, spacing } from "@/lib/theme";

export default function SettingsScreen() {
  const { signOut, isSigningOut, error } = useSignOut();

  return (
    <View style={styles.screen}>
      <PlaceholderScreen />
      {/* Temporary until the settings screen issue adds the account section. */}
      {/* The app is drawn edge to edge, so keep the button above the system navigation. */}
      <SafeAreaView edges={["bottom"]} style={styles.account}>
        {error && (
          <HelperText type="error" accessibilityLiveRegion="assertive">
            {error}
          </HelperText>
        )}
        <Button
          mode="outlined"
          icon="logout"
          onPress={signOut}
          loading={isSigningOut}
          disabled={isSigningOut}
          contentStyle={styles.buttonContent}
        >
          Abmelden
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  account: {
    padding: spacing("space-4"),
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
