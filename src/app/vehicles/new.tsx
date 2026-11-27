import { useNavigation } from "expo-router";

import { VehicleForm } from "@/components/VehicleForm";
import { useVehicleForm } from "@/features/vehicles/hooks/useVehicleForm";
import { useCreateVehicle } from "@/features/vehicles/hooks/useVehicles";

/** Adding another vehicle (M1). The first one comes from the onboarding. */
export default function NewVehicleScreen() {
  const navigation = useNavigation();
  const { mutateAsync: createVehicle } = useCreateVehicle();
  const form = useVehicleForm(async (input) => {
    await createVehicle(input);
    // The user may have gone back while saving; then this screen is closed already.
    if (navigation.isFocused()) navigation.goBack();
  });

  return <VehicleForm form={form} submitLabel="Fahrzeug anlegen" />;
}
