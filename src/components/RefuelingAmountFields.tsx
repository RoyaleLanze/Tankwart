import type { Control, UseFormSetFocus } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

import type { ComputedAmount } from "@/features/refuelings/logic/computeMissing";
import type { RefuelingFormValues } from "@/features/refuelings/logic/formValues";
import { refuelingErrorText } from "@/features/refuelings/messages";
import type { RefuelingInput } from "@/features/refuelings/types";
import {
  UNIT_EURO,
  UNIT_LITER,
  UNIT_PRICE_PER_LITER,
  formatEuro,
  formatLiters,
  formatPricePerLiterText,
} from "@/lib/format";
import { spacing, useAppTheme } from "@/lib/theme";

import { FormTextField } from "./FormTextField";

type Props = {
  control: Control<RefuelingFormValues, unknown, RefuelingInput>;
  setFocus: UseFormSetFocus<RefuelingFormValues>;
  /** The empty field the app is about to compute, see computedAmount(). */
  computed: ComputedAmount | null;
};

type AmountField = {
  name: "volumeLiters" | "pricePerLiter" | "totalEuros";
  labelKey: "refuelingForm.volume" | "refuelingForm.pricePerLiter" | "refuelingForm.total";
  icon: string;
  unit: string;
  /** The value the app computes into this field when it is the empty one. */
  computes: ComputedAmount["field"];
  /** Field that gets the focus on "next". */
  next: "pricePerLiter" | "totalEuros" | "odometerKm";
};

const AMOUNT_FIELDS: AmountField[] = [
  {
    name: "volumeLiters",
    labelKey: "refuelingForm.volume",
    icon: "gas-station-outline",
    unit: UNIT_LITER,
    computes: "volumeMl",
    next: "pricePerLiter",
  },
  {
    name: "pricePerLiter",
    labelKey: "refuelingForm.pricePerLiter",
    icon: "tag-outline",
    unit: UNIT_PRICE_PER_LITER,
    computes: "pricePerLiterTenthCents",
    next: "totalEuros",
  },
  {
    name: "totalEuros",
    labelKey: "refuelingForm.total",
    icon: "cash",
    unit: UNIT_EURO,
    computes: "totalCents",
    next: "odometerKm",
  },
];

/** The computed value as text, e.g. "52,4 L" or "1,749 €/L". */
function formatComputed({ field, value }: ComputedAmount): string {
  if (field === "volumeMl") return formatLiters(value);
  if (field === "totalCents") return formatEuro(value);
  return formatPricePerLiterText(value);
}

/** Volume, price per liter and total: two of the three are enough (M3). */
export function RefuelingAmountFields({ control, setFocus, computed }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View style={styles.fields}>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
        {t("refuelingForm.amountsHint")}
      </Text>
      {AMOUNT_FIELDS.map(({ name, labelKey, icon, unit, computes, next }) => {
        const isComputed = computed?.field === computes;
        return (
          <View key={name}>
            <FormTextField
              control={control}
              name={name}
              label={t(labelKey)}
              icon={icon}
              right={isComputed ? undefined : <TextInput.Affix text={unit} />}
              helperText={
                isComputed
                  ? t("refuelingForm.computed", { value: formatComputed(computed) })
                  : undefined
              }
              // design-system.md → TextField: tonal fill without a border (errors still get theirs).
              style={isComputed ? { backgroundColor: colors.surfaceVariant } : undefined}
              outlineColor={isComputed ? "transparent" : undefined}
              activeOutlineColor={isComputed ? "transparent" : undefined}
              errorText={refuelingErrorText}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => setFocus(next)}
            />
            {isComputed && (
              // Paper hides an affix while the field is empty and unfocused, so it is drawn here.
              <View style={styles.computedAffix} pointerEvents="none">
                <Text
                  variant="bodyLarge"
                  style={{ color: colors.onSurfaceVariant }}
                  importantForAccessibility="no"
                >
                  {t("refuelingForm.computedAffix")}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Height of a text field (design-system.md → TextField). */
const INPUT_HEIGHT = 56;
/** Paper draws the outline this far below the field's top edge, leaving room for the label. */
const OUTLINE_OFFSET = 6;

const styles = StyleSheet.create({
  fields: {
    gap: spacing("space-4"),
  },
  computedAffix: {
    position: "absolute",
    top: OUTLINE_OFFSET,
    right: spacing("space-4"),
    height: INPUT_HEIGHT - OUTLINE_OFFSET,
    justifyContent: "center",
  },
});
