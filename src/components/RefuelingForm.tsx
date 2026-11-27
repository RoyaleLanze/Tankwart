import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { useRefuelingForm } from "@/features/refuelings/hooks/useRefuelingForm";
import { refuelingErrorText, refuelingWarningText } from "@/features/refuelings/messages";
import { sizes, spacing, useAppTheme } from "@/lib/theme";

import { FormSwitch } from "./FormSwitch";
import { FormTextField } from "./FormTextField";
import { RefuelingAmountFields } from "./RefuelingAmountFields";

type Props = {
  /** State and actions from useRefuelingForm. */
  form: ReturnType<typeof useRefuelingForm>;
};

/** Adding a refueling (M3, M4, mockup 7.4): the fields, the switches and saving. */
export function RefuelingForm({ form }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { control, setFocus, submit, isSubmitting, submitError, computed, odometerWarning } = form;

  return (
    // The app is drawn edge to edge, so keep the button above the system navigation.
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior="padding"
        keyboardVerticalOffset={insets.top + sizes("top-app-bar")}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormTextField
            control={control}
            name="refueledOn"
            label={t("refuelingForm.date")}
            icon="calendar-outline"
            helperText={t("refuelingForm.dateHint")}
            errorText={refuelingErrorText}
            returnKeyType="next"
            onSubmitEditing={() => setFocus("volumeLiters")}
          />
          <RefuelingAmountFields control={control} setFocus={setFocus} computed={computed} />
          <FormTextField
            control={control}
            name="odometerKm"
            label={t("refuelingForm.odometer")}
            icon="speedometer"
            right={<TextInput.Affix text="km" />}
            helperText={odometerWarning && refuelingWarningText(odometerWarning)}
            helperColor={colors.warningStrong}
            errorText={refuelingErrorText}
            keyboardType="number-pad"
            returnKeyType="next"
            onSubmitEditing={() => setFocus("stationName")}
          />
          <FormTextField
            control={control}
            name="stationName"
            label={t("refuelingForm.station")}
            icon="gas-station"
            errorText={refuelingErrorText}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => setFocus("note")}
          />
          <FormSwitch control={control} name="isFullTank" label={t("refuelingForm.fullTank")} />
          <FormSwitch
            control={control}
            name="previousMissed"
            label={t("refuelingForm.previousMissed")}
            description={t("refuelingForm.previousMissedHint")}
          />
          <FormTextField
            control={control}
            name="note"
            label={t("refuelingForm.note")}
            icon="note-text-outline"
            errorText={refuelingErrorText}
            multiline
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
              {t("refuelingForm.save")}
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
