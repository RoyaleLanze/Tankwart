import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { VehicleRequiredFields } from "@/components/VehicleRequiredFields";
import { useVehicleForm } from "@/features/vehicles/hooks/useVehicleForm";
import { useCreateVehicle } from "@/features/vehicles/hooks/useVehicles";
import { sizes, spacing, useAppTheme } from "@/lib/theme";

/**
 * First start without a vehicle (M1, mockup 7.2), one step only. The root layout shows this
 * screen as long as the user has no vehicle and leaves it as soon as one is saved.
 */
export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const { mutateAsync: createVehicle } = useCreateVehicle();
  const { control, setFocus, submit, isSubmitting, submitError } = useVehicleForm(createVehicle);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text variant="headlineMedium" accessibilityRole="header">
              Dein erstes Fahrzeug
            </Text>
            <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant }}>
              Damit wir Verbrauch und Kosten pro Fahrzeug berechnen können.
            </Text>
          </View>
          <VehicleRequiredFields control={control} setFocus={setFocus} onLastFieldSubmit={submit} />
          {/* Pushes the button to the bottom of the screen when there is space left. */}
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
              contentStyle={styles.submitContent}
            >
              Fahrzeug anlegen
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
    flexGrow: 1,
    gap: spacing("space-6"),
    padding: spacing("space-6"),
  },
  intro: {
    gap: spacing("space-2"),
  },
  footer: {
    marginTop: "auto",
    gap: spacing("space-2"),
  },
  submitContent: {
    minHeight: sizes("touch-min"),
  },
});
