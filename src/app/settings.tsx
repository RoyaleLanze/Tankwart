import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, List } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { vehicleCountText } from "@/features/vehicles/messages";
import { sizes, spacing } from "@/lib/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, isSigningOut, error } = useSignOut();
  const { data: vehicles = [] } = useVehicles();

  return (
    <View style={styles.screen}>
      {/* The other sections of mockup 7.9 follow with the settings screen issue. */}
      <List.Section>
        {/* Paper's section title is no heading for TalkBack, so it is set here. */}
        <List.Subheader accessibilityRole="header">Fahrzeuge</List.Subheader>
        <List.Item
          title="Fahrzeuge verwalten"
          description={vehicleCountText(vehicles.length)}
          left={(props) => <List.Icon {...props} icon="car-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push("/vehicles")}
          accessibilityRole="button"
        />
      </List.Section>
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
  // Pushes the sign-out button to the bottom.
  account: {
    marginTop: "auto",
    padding: spacing("space-4"),
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
