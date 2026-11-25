import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { spacing } from "@/lib/theme";

/** Temporary content for screens whose feature issue is not done yet. */
export function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text variant="bodyLarge">Dieser Bereich ist noch in Arbeit.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing("space-4"),
  },
});
