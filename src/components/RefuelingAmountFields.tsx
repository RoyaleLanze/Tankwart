import type { Control, UseFormSetFocus } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

import type { ComputedAmount } from "@/features/refuelings/logic/computeMissing";
import type { RefuelingFormValues } from "@/features/refuelings/logic/formValues";
import { refuelingErrorText } from "@/features/refuelings/messages";
import type { RefuelingInput } from "@/features/refuelings/types";
import { EURO_SUFFIX, formatEuro, formatLiters, formatPricePerLiter } from "@/lib/format";
import { spacing, useAppTheme } from "@/lib/theme";

import { FormTextField } from "./FormTextField";

type Props = {
  control: Control<RefuelingFormValues, unknown, RefuelingInput>;
  setFocus: UseFormSetFocus<RefuelingFormValues>;
  /** The empty field the app is about to compute, see computedAmount(). */
  computed: ComputedAmount | null;
};

/** The computed value as text, e.g. "52,4 L" or "1,749 €/L" (without the superscript). */
function formatComputed({ field, value }: ComputedAmount): string {
  if (field === "volumeMl") return formatLiters(value);
  if (field === "totalCents") return formatEuro(value);
  const price = formatPricePerLiter(value);
  return `${price.euroAndCents}${price.tenthCent}${EURO_SUFFIX}/L`;
}

/** Volume, price per liter and total: two of the three are enough (M3). */
export function RefuelingAmountFields({ control, setFocus, computed }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const hint = (field: ComputedAmount["field"]) =>
    computed?.field === field
      ? t("refuelingForm.computed", { value: formatComputed(computed) })
      : undefined;

  return (
    <View style={styles.fields}>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
        {t("refuelingForm.amountsHint")}
      </Text>
      <FormTextField
        control={control}
        name="volumeLiters"
        label={t("refuelingForm.volume")}
        icon="gas-station-outline"
        right={<TextInput.Affix text="L" />}
        helperText={hint("volumeMl")}
        errorText={refuelingErrorText}
        keyboardType="decimal-pad"
        returnKeyType="next"
        onSubmitEditing={() => setFocus("pricePerLiter")}
      />
      <FormTextField
        control={control}
        name="pricePerLiter"
        label={t("refuelingForm.pricePerLiter")}
        icon="tag-outline"
        right={<TextInput.Affix text="€/L" />}
        helperText={hint("pricePerLiterTenthCents")}
        errorText={refuelingErrorText}
        keyboardType="decimal-pad"
        returnKeyType="next"
        onSubmitEditing={() => setFocus("totalEuros")}
      />
      <FormTextField
        control={control}
        name="totalEuros"
        label={t("refuelingForm.total")}
        icon="cash"
        right={<TextInput.Affix text="€" />}
        helperText={hint("totalCents")}
        errorText={refuelingErrorText}
        keyboardType="decimal-pad"
        returnKeyType="next"
        onSubmitEditing={() => setFocus("odometerKm")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing("space-4"),
  },
});
