import type { Control, UseFormSetFocus } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";

import { FUEL_TYPES, type VehicleFormValues } from "@/features/vehicles/logic/vehicleSchema";
import { FUEL_TYPE_LABELS, vehicleErrorText } from "@/features/vehicles/messages";
import type { VehicleInput } from "@/features/vehicles/types";
import { spacing } from "@/lib/theme";

import { FormChipGroup } from "./FormChipGroup";
import { FormTextField } from "./FormTextField";

const FUEL_OPTIONS = FUEL_TYPES.map((value) => ({ value, label: FUEL_TYPE_LABELS[value] }));

type Props = {
  control: Control<VehicleFormValues, unknown, VehicleInput>;
  setFocus: UseFormSetFocus<VehicleFormValues>;
  /** Called by the keyboard's action key in the last field, e.g. to save. */
  onLastFieldSubmit: () => void;
  /** The action key's label in the last field: "done" when it saves, "next" when more follows. */
  lastReturnKeyType?: "done" | "next";
};

/** The four fields every vehicle needs (M1), as in mockup 7.2. */
export function VehicleRequiredFields({
  control,
  setFocus,
  onLastFieldSubmit,
  lastReturnKeyType = "done",
}: Props) {
  return (
    <View style={styles.fields}>
      <FormTextField
        control={control}
        name="name"
        label="Name"
        icon="car-outline"
        errorText={vehicleErrorText}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => setFocus("initialOdometerKm")}
      />
      <FormChipGroup
        control={control}
        name="fuelType"
        label="Kraftstoff"
        options={FUEL_OPTIONS}
        errorText={vehicleErrorText}
      />
      <FormTextField
        control={control}
        name="initialOdometerKm"
        label="Aktueller Kilometerstand"
        icon="speedometer"
        right={<TextInput.Affix text="km" />}
        helperText="Ab diesem Stand werden deine Strecken gezählt."
        errorText={vehicleErrorText}
        keyboardType="number-pad"
        returnKeyType="next"
        onSubmitEditing={() => setFocus("tankCapacityLiters")}
      />
      <FormTextField
        control={control}
        name="tankCapacityLiters"
        label="Tankvolumen"
        icon="gas-station-outline"
        right={<TextInput.Affix text="L" />}
        helperText="Damit prüft die App, ob die getankten Liter passen."
        errorText={vehicleErrorText}
        keyboardType="decimal-pad"
        returnKeyType={lastReturnKeyType}
        onSubmitEditing={onLastFieldSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing("space-4"),
  },
});
