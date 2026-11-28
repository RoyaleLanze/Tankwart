import type { Control, UseFormSetFocus } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ComputedAmount } from "@/features/refuelings/logic/computeMissing";
import type { RefuelingFormValues } from "@/features/refuelings/logic/formValues";
import type { RefuelingWarningCode } from "@/features/refuelings/logic/rules";
import { refuelingErrorText, refuelingWarningText } from "@/features/refuelings/messages";
import type { RefuelingInput } from "@/features/refuelings/types";
import { UNIT_KM } from "@/lib/format";
import { sizes, spacing, useAppTheme } from "@/lib/theme";

import { FormTextField } from "./FormTextField";
import { RefuelingAmountFields } from "./RefuelingAmountFields";
import { RefuelingDetailFields } from "./RefuelingDetailFields";

type Props = {
  control: Control<RefuelingFormValues, unknown, RefuelingInput>;
  setFocus: UseFormSetFocus<RefuelingFormValues>;
  onSubmit: () => void;
  isSubmitting: boolean;
  /** Error that belongs to no field, shown above the button. */
  submitError?: string;
  /** The empty amount the app computes, see computedAmount(). */
  computed: ComputedAmount | null;
  /** Warning for the odometer; does not block saving. */
  odometerWarning?: RefuelingWarningCode;
};

/**
 * Adding a refueling (M3, M4, mockup 7.4): the fields scroll, the save button stays at the
 * bottom (design-system.md → Layout).
 */
export function RefuelingForm({
  control,
  setFocus,
  onSubmit,
  isSubmitting,
  submitError,
  computed,
  odometerWarning,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

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
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => setFocus("volumeLiters")}
          />
          <RefuelingAmountFields control={control} setFocus={setFocus} computed={computed} />
          <FormTextField
            control={control}
            name="odometerKm"
            label={t("refuelingForm.odometer")}
            icon="speedometer"
            right={<TextInput.Affix text={UNIT_KM} />}
            helperText={odometerWarning && refuelingWarningText(odometerWarning)}
            helperColor={colors.warningStrong}
            helperIcon="alert-outline"
            helperLive
            errorText={refuelingErrorText}
            keyboardType="number-pad"
            returnKeyType="next"
            onSubmitEditing={() => setFocus("stationName")}
          />
          <RefuelingDetailFields control={control} setFocus={setFocus} />
        </ScrollView>
        <View style={styles.footer}>
          {/* Always mounted: a live region only announces changes below a node that exists. */}
          <View accessibilityLiveRegion="assertive">
            {submitError ? <HelperText type="error">{submitError}</HelperText> : null}
          </View>
          <Button
            mode="contained"
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            contentStyle={styles.buttonContent}
          >
            {t("refuelingForm.save")}
          </Button>
        </View>
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
    // No gap: the always mounted error wrapper is empty without an error and would add one.
    padding: spacing("space-4"),
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
