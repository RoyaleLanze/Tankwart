import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";

import { spacing } from "@/lib/theme";

/**
 * Extended FAB "Betankung erfassen" (design-system.md → ExtendedFab). Home and history show it;
 * it floats 16 dp above the navigation bar, so the parent must fill the screen (`flex: 1`).
 */
export function RefuelingFab() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <FAB
      icon="plus"
      label={t("refuelingForm.fabLabel")}
      onPress={() => router.push("/refuelings/new")}
      style={styles.fab}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing("space-4"),
    bottom: spacing("space-4"),
  },
});
