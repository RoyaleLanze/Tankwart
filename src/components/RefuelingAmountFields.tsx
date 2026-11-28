import { useState } from "react";
import type { Control, UseFormSetFocus } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
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

type FormProps = {
  control: Control<RefuelingFormValues, unknown, RefuelingInput>;
  setFocus: UseFormSetFocus<RefuelingFormValues>;
};

type Props = FormProps & {
  /** The empty field the app is about to compute, see computedAmount(). */
  computed: ComputedAmount | null;
};

type AmountFieldConfig = {
  name: "volumeLiters" | "pricePerLiter" | "totalEuros";
  labelKey: "refuelingForm.volume" | "refuelingForm.pricePerLiter" | "refuelingForm.total";
  icon: string;
  unit: string;
  /** The value the app computes into this field when it is the empty one. */
  computes: ComputedAmount["field"];
  /** Field that gets the focus on "next". */
  next: "pricePerLiter" | "totalEuros" | "odometerKm";
};

const AMOUNT_FIELDS: AmountFieldConfig[] = [
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

/** One amount field. As the computed one it gets the tonal look and the "computed" label. */
function AmountField({
  control,
  setFocus,
  computed,
  config: { name, labelKey, icon, unit, computes, next },
}: FormProps & { computed: ComputedAmount | null; config: AmountFieldConfig }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [affixWidth, setAffixWidth] = useState(0);
  const isComputed = computed?.field === computes;
  const onAffixLayout = (event: LayoutChangeEvent) => setAffixWidth(event.nativeEvent.layout.width);

  return (
    <View>
      <FormTextField
        control={control}
        name={name}
        label={t(labelKey)}
        icon={icon}
        right={isComputed ? undefined : <TextInput.Affix text={unit} />}
        helperText={
          isComputed ? t("refuelingForm.computed", { value: formatComputed(computed) }) : undefined
        }
        helperLive={isComputed}
        // design-system.md → TextField: tonal fill without a border (errors still get theirs).
        // The active outline stays, it is the focus indicator.
        style={isComputed ? { backgroundColor: colors.surfaceVariant } : undefined}
        outlineColor={isComputed ? "transparent" : undefined}
        // On the tonal fill onSurfaceVariant only reaches 4.3:1, so the label uses onSurface.
        theme={isComputed ? { colors: { onSurfaceVariant: colors.onSurface } } : undefined}
        // Keeps long values from running under the "computed" label.
        contentStyle={isComputed ? { paddingRight: affixWidth + 2 * AFFIX_MARGIN } : undefined}
        errorText={refuelingErrorText}
        keyboardType="decimal-pad"
        returnKeyType="next"
        onSubmitEditing={() => setFocus(next)}
      />
      {isComputed && (
        // Paper hides an affix while the field is empty and unfocused, so it is drawn here.
        <View style={styles.computedAffix} onLayout={onAffixLayout}>
          <Text
            variant="bodyLarge"
            style={{ color: colors.onSurface }}
            importantForAccessibility="no"
          >
            {t("refuelingForm.computedAffix")}
          </Text>
        </View>
      )}
    </View>
  );
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
      {AMOUNT_FIELDS.map((config) => (
        <AmountField
          key={config.name}
          control={control}
          setFocus={setFocus}
          computed={computed}
          config={config}
        />
      ))}
    </View>
  );
}

/**
 * Paper's outlined input is 56 dp high (MD3, design-system.md → TextField) and draws its outline
 * 6 dp below the top edge, leaving room for the label. Both values are fixed inside Paper and not
 * exported, and the computed label has to line up with the outline.
 */
const PAPER_INPUT_HEIGHT = 56;
const PAPER_OUTLINE_OFFSET = 6;
const AFFIX_MARGIN = spacing("space-4");

const styles = StyleSheet.create({
  fields: {
    gap: spacing("space-4"),
  },
  computedAffix: {
    position: "absolute",
    top: PAPER_OUTLINE_OFFSET,
    right: AFFIX_MARGIN,
    height: PAPER_INPUT_HEIGHT - PAPER_OUTLINE_OFFSET,
    justifyContent: "center",
    // Touches go to the field below.
    pointerEvents: "none",
  },
});
