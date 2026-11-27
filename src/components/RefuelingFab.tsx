import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";

import { spacing, useAppTheme } from "@/lib/theme";

/**
 * Extended FAB "Betankung erfassen" (design-system.md → ExtendedFab). Home and history show it;
 * it floats 16 dp above the navigation bar, so the parent must fill the screen (`flex: 1`).
 */
export function RefuelingFab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <FAB
      icon="plus"
      label={t("refuelingForm.fabLabel")}
      onPress={() => router.push("/refuelings/new")}
      // design-system.md: the FAB is a primary action, so it uses `primary`, not Paper's container.
      color={colors.onPrimary}
      style={[styles.fab, { backgroundColor: colors.primary }]}
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
