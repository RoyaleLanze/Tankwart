import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { useVehicleForm } from "@/features/vehicles/hooks/useVehicleForm";
import { vehicleErrorText } from "@/features/vehicles/messages";
import { sizes, spacing, useAppTheme } from "@/lib/theme";

import { FormTextField } from "./FormTextField";
import { VehicleRequiredFields } from "./VehicleRequiredFields";

type Props = {
  /** State and actions from useVehicleForm. */
  form: ReturnType<typeof useVehicleForm>;
  /** Label of the save button, e.g. "Speichern". */
  submitLabel: string;
};

/** Adding or editing a vehicle: the required fields, the optional ones (M1) and saving. */
export function VehicleForm({ form, submitLabel }: Props) {
  const { colors } = useAppTheme();
  const { control, setFocus, submit, isSubmitting, submitError } = form;

  return (
    // The app is drawn edge to edge, so keep the button above the system navigation.
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <VehicleRequiredFields
            control={control}
            setFocus={setFocus}
            onLastFieldSubmit={() => setFocus("makeModel")}
            lastReturnKeyType="next"
          />
          <Text
            variant="titleSmall"
            accessibilityRole="header"
            style={{ color: colors.onSurfaceVariant }}
          >
            Weitere Angaben (optional)
          </Text>
          <FormTextField
            control={control}
            name="makeModel"
            label="Marke und Modell"
            errorText={vehicleErrorText}
            returnKeyType="next"
            onSubmitEditing={() => setFocus("licensePlate")}
          />
          <FormTextField
            control={control}
            name="licensePlate"
            label="Kennzeichen"
            errorText={vehicleErrorText}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => setFocus("consumptionLitersPer100Km")}
          />
          <FormTextField
            control={control}
            name="consumptionLitersPer100Km"
            label="Verbrauch laut Hersteller"
            right={<TextInput.Affix text="L/100 km" />}
            errorText={vehicleErrorText}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <View style={styles.footer}>
            {submitError && (
              <HelperText type="error" accessibilityLiveRegion="assertive">
                {submitError}
              </HelperText>
            )}
            <Button
              mode="contained"
              onPress={submit}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={styles.buttonContent}
            >
              {submitLabel}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing("space-4"),
    padding: spacing("space-4"),
  },
  footer: {
    gap: spacing("space-2"),
    marginTop: spacing("space-4"),
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
