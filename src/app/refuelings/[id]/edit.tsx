import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { ErrorScreen } from "@/components/ErrorScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RefuelingForm } from "@/components/RefuelingForm";
import { useEditRefuelingForm } from "@/features/refuelings/hooks/useEditRefuelingForm";
import { useRefuelings } from "@/features/refuelings/hooks/useRefuelings";
import { useSaveAndLeave } from "@/features/refuelings/hooks/useSaveAndLeave";
import { LOAD_ERROR_TEXT } from "@/features/refuelings/messages";
import type { Refueling } from "@/features/refuelings/types";
import { useActiveVehicle } from "@/features/vehicles/hooks/useActiveVehicle";
import type { Vehicle } from "@/features/vehicles/types";
import { sizes, spacing } from "@/lib/theme";

/**
 * Editing a refueling of the active vehicle (M3). It comes from the cached list, not a request
 * of its own. A save that finds the row gone loads the list again, so the refueling disappears
 * from it and this screen switches to "not found" by itself.
 */
export default function EditRefuelingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = useActiveVehicle();
  const refuelings = useRefuelings(vehicle?.id);

  // Not isPending: with a vehicle the query runs, so no data and no error means loading.
  if (vehicle && refuelings.data === undefined) {
    return refuelings.isError ? (
      <ErrorScreen message={LOAD_ERROR_TEXT} onRetry={() => refuelings.refetch()} />
    ) : (
      <LoadingScreen label={t("refuelingForm.loading")} />
    );
  }
  const refueling = refuelings.data?.find((candidate) => candidate.id === id);
  if (!vehicle || !refueling || !refuelings.data) {
    // Deleted on another device, or an old link. From a deep link there is no previous screen.
    return (
      <View style={styles.notFound}>
        <Text variant="bodyLarge" accessibilityLiveRegion="polite">
          {t("refuelingForm.notFound")}
        </Text>
        <Button
          mode="contained"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          contentStyle={styles.buttonContent}
        >
          {t("refuelingForm.back")}
        </Button>
      </View>
    );
  }
  return <EditRefuelingForm vehicle={vehicle} refuelings={refuelings.data} refueling={refueling} />;
}

/** The form reads its start values once, so it is only shown once the refueling is known. */
function EditRefuelingForm({
  vehicle,
  refuelings,
  refueling,
}: {
  vehicle: Vehicle;
  refuelings: readonly Refueling[];
  refueling: Refueling;
}) {
  const { submit, ...formProps } = useEditRefuelingForm(vehicle, refuelings, refueling);
  const saveAndLeave = useSaveAndLeave(submit, formProps.isSubmitting);
  return <RefuelingForm {...formProps} onSubmit={saveAndLeave} />;
}

const styles = StyleSheet.create({
  notFound: {
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
