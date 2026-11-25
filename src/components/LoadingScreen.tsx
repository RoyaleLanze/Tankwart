import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

import { spacing, useAppTheme } from "@/lib/theme";

type Props = {
  /** Says what is loading, e.g. "Anmeldung wird geprüft …". */
  label: string;
};

/** Full-screen loading state (M15). */
export function LoadingScreen({ label }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator />
      <Text variant="bodyLarge" accessibilityLiveRegion="polite">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing("space-4"),
    padding: spacing("space-4"),
  },
});
