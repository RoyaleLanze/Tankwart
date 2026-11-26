import { useRouter } from "expo-router";

import { VehicleForm } from "@/components/VehicleForm";
import { useVehicleForm } from "@/features/vehicles/hooks/useVehicleForm";
import { useCreateVehicle } from "@/features/vehicles/hooks/useVehicles";

/** Adding another vehicle (M1). The first one comes from the onboarding. */
export default function NewVehicleScreen() {
  const router = useRouter();
  const { mutateAsync: createVehicle } = useCreateVehicle();
  const form = useVehicleForm(async (input) => {
    await createVehicle(input);
    router.back();
  });

  return <VehicleForm form={form} submitLabel="Fahrzeug anlegen" />;
}
