import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { EURO_SUFFIX, formatPricePerLiter } from "@/lib/format";
import { typeStyle, useAppTheme } from "@/lib/theme";

/** The third decimal is shown at 60 % size, like on a price board (design-system.md → PriceTag). */
const SUPERSCRIPT_SCALE = 0.6;

const priceStyle = typeStyle("price-lg");

type Props = {
  pricePerLiterTenthCents: number;
};

/**
 * Price per liter as "1,74⁹ €", read by screen readers as "1 Euro 74,9 Cent pro Liter".
 * Only on `surface` or `background`: on `surface-variant` the price color misses 4.5:1 contrast.
 */
export function PriceTag({ pricePerLiterTenthCents }: Props) {
  const { colors } = useAppTheme();
  const price = formatPricePerLiter(pricePerLiterTenthCents);
  const textStyle = [priceStyle, { color: colors.price }];

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={price.accessibilityLabel}
    >
      <Text style={textStyle}>{price.euroAndCents}</Text>
      <Text style={[textStyle, styles.superscript]}>{price.tenthCent}</Text>
      <Text style={textStyle}>{EURO_SUFFIX}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  superscript: {
    fontSize: priceStyle.fontSize * SUPERSCRIPT_SCALE,
    lineHeight: priceStyle.lineHeight * SUPERSCRIPT_SCALE,
  },
});
