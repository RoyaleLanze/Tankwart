import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { VehicleForm } from "@/components/VehicleForm";
import { useVehicleForm } from "@/features/vehicles/hooks/useVehicleForm";
import { useUpdateVehicle, useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { vehicleToFormValues } from "@/features/vehicles/logic/vehicleSchema";
import { NOT_FOUND_TEXT } from "@/features/vehicles/messages";
import type { Vehicle } from "@/features/vehicles/types";
import { spacing } from "@/lib/theme";

/** Editing a vehicle (M1). The vehicle comes from the cached list, not a request of its own. */
export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicles } = useVehicles();
  const vehicle = vehicles?.find((candidate) => candidate.id === id);

  if (!vehicle) {
    return (
      <View style={styles.notFound}>
        <Text variant="bodyLarge">{NOT_FOUND_TEXT}</Text>
      </View>
    );
  }
  return <EditVehicleForm vehicle={vehicle} />;
}

/** The form reads its start values once, so it is only shown once the vehicle is known. */
function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const { mutateAsync: updateVehicle } = useUpdateVehicle(vehicle.id);
  const form = useVehicleForm(async (input) => {
    await updateVehicle(input);
    router.back();
  }, vehicleToFormValues(vehicle));

  return <VehicleForm form={form} submitLabel="Speichern" />;
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing("space-4"),
  },
});
