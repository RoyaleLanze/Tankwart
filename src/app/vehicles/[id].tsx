import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { VehicleForm } from "@/components/VehicleForm";
import type { OdometerText } from "@/components/VehicleRequiredFields";
import { useVehicleForm } from "@/features/vehicles/hooks/useVehicleForm";
import { useUpdateVehicle, useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { NOT_FOUND_TEXT } from "@/features/vehicles/messages";
import type { Vehicle } from "@/features/vehicles/types";
import { sizes, spacing } from "@/lib/theme";

// The field holds the odometer from adding the vehicle, not today's. Changing it can make
// existing refuelings invalid (ADR 0012, addendum 25.11.), so the hint says when to change it.
const INITIAL_ODOMETER: OdometerText = {
  label: "Kilometerstand beim Anlegen",
  helperText:
    "Ab diesem Stand werden deine Strecken gezählt. Ändere ihn nur, wenn er falsch eingegeben wurde.",
};

/** Editing a vehicle (M1). The vehicle comes from the cached list, not a request of its own. */
export default function EditVehicleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicles } = useVehicles();
  const vehicle = vehicles?.find((candidate) => candidate.id === id);

  if (!vehicle) {
    // Deleted on another device, or an old link. The list is the way back, also from a deep
    // link where there is no previous screen.
    return (
      <View style={styles.notFound}>
        <Text variant="bodyLarge" accessibilityLiveRegion="polite">
          {NOT_FOUND_TEXT}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.replace("/vehicles")}
          contentStyle={styles.buttonContent}
        >
          Zur Fahrzeugliste
        </Button>
      </View>
    );
  }
  return <EditVehicleForm vehicle={vehicle} />;
}

/** The form reads its start values once, so it is only shown once the vehicle is known. */
function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const navigation = useNavigation();
  const { mutateAsync: updateVehicle } = useUpdateVehicle(vehicle.id);
  const form = useVehicleForm(async (input) => {
    await updateVehicle(input);
    // The user may have gone back while saving; then this screen is closed already.
    if (navigation.isFocused()) navigation.goBack();
  }, vehicle);

  return <VehicleForm form={form} submitLabel="Speichern" odometerText={INITIAL_ODOMETER} />;
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
