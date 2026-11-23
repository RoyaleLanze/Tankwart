import { StyleSheet, View } from "react-native";
import { Button, HelperText } from "react-native-paper";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { sizes, spacing } from "@/lib/theme";

export default function SettingsScreen() {
  const { signOut, isSigningOut, error } = useSignOut();

  return (
    <View style={styles.screen}>
      <PlaceholderScreen />
      {/* Temporary until the settings screen issue adds the account section. */}
      <View style={styles.account}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  account: {
    padding: spacing["space-4"],
  },
  buttonContent: {
    minHeight: sizes["touch-min"],
  },
});
