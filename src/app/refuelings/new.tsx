import { useNavigation, usePreventRemove, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RefuelingForm } from "@/components/RefuelingForm";
import { useRefuelingForm } from "@/features/refuelings/hooks/useRefuelingForm";
import { useRefuelings } from "@/features/refuelings/hooks/useRefuelings";
import { LOAD_ERROR_TEXT } from "@/features/refuelings/messages";
import type { Refueling } from "@/features/refuelings/types";
import { useActiveVehicle } from "@/features/vehicles/hooks/useActiveVehicle";
import type { Vehicle } from "@/features/vehicles/types";
import { sizes, spacing } from "@/lib/theme";

/** Adding a refueling for the active vehicle (M3). The M4 rules need its other refuelings. */
export default function NewRefuelingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const vehicle = useActiveVehicle();
  const refuelings = useRefuelings(vehicle?.id);

  // Practically only while signed out: the root layout shows the tabs only with a vehicle.
  if (!vehicle) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyLarge" accessibilityLiveRegion="polite">
          {t("refuelingForm.noVehicle")}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.replace("/vehicles/new")}
          contentStyle={styles.buttonContent}
        >
          {t("refuelingForm.addVehicle")}
        </Button>
      </View>
    );
  }
  // Not isPending: with a vehicle the query runs, so no data and no error means loading.
  if (refuelings.data === undefined) {
    return refuelings.isError ? (
      <ErrorScreen message={LOAD_ERROR_TEXT} onRetry={() => refuelings.refetch()} />
    ) : (
      <LoadingScreen label={t("refuelingForm.loading")} />
    );
  }
  // The key restarts the form (new id, new defaults) if the active vehicle changes while it is open.
  return <NewRefuelingForm key={vehicle.id} vehicle={vehicle} refuelings={refuelings.data} />;
}

/**
 * The form reads its start values once, so it is only shown once the refuelings are known.
 * Going back is blocked while saving: the answer would otherwise arrive at a closed screen.
 */
function NewRefuelingForm({
  vehicle,
  refuelings,
}: {
  vehicle: Vehicle;
  refuelings: readonly Refueling[];
}) {
  const navigation = useNavigation();
  const { submit, ...formProps } = useRefuelingForm(vehicle, refuelings);
  const allowLeaving = usePreventRemove(formProps.isSubmitting);

  async function save() {
    if (!(await submit())) return;
    // Not focused anymore, e.g. after a sign-out while saving: nothing to close.
    if (!navigation.isFocused()) return;
    allowLeaving();
    navigation.goBack();
  }

  return <RefuelingForm {...formProps} onSubmit={save} />;
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing("space-4"),
    padding: spacing("space-4"),
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
