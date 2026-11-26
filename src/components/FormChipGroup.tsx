import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Chip, HelperText, Text } from "react-native-paper";

import { CHIP_HIT_SLOP, spacing, useAppTheme } from "@/lib/theme";

type Option = { value: string; label: string };

type Props<T extends FieldValues, TTransformed> = {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  /** Visible label above the chips, also read by the screen reader. */
  label: string;
  options: readonly Option[];
  /** Turns a validation code from the schema into the text shown to the user (ADR 0014). */
  errorText: (message: string) => string;
};

/**
 * Exactly one choice from a few options as filter chips, bound to react-hook-form
 * (design-system.md → Chip). The selected chip shows a check mark, not only a color.
 */
export function FormChipGroup<T extends FieldValues, TTransformed = T>({
  control,
  name,
  label,
  options,
  errorText,
}: Props<T, TTransformed>) {
  const { colors } = useAppTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const shownError = error && errorText(error.message ?? "");
        return (
          <View style={styles.group}>
            <Text
              variant="labelLarge"
              style={{ color: error ? colors.error : colors.onSurfaceVariant }}
            >
              {label}
            </Text>
            {/* No label on this row: the visible label above is read right before the chips. */}
            <View style={styles.chips}>
              {options.map((option) => {
                const selected = field.value === option.value;
                return (
                  <Chip
                    key={option.value}
                    mode="outlined"
                    selected={selected}
                    showSelectedCheck
                    // M3 filter chips: unselected ones are unfilled, the selected one is filled.
                    // Paper fills both with surface, so the colors are set here.
                    style={{
                      backgroundColor: selected ? colors.secondaryContainer : colors.background,
                    }}
                    selectedColor={selected ? colors.onSecondaryContainer : undefined}
                    onPress={() => field.onChange(option.value)}
                    hitSlop={CHIP_HIT_SLOP}
                    // Exactly one choice: TalkBack reads "Optionsfeld" and the selected state.
                    accessibilityRole="radio"
                  >
                    {option.label}
                  </Chip>
                );
              })}
            </View>
            {shownError && (
              <HelperText type="error" padding="none" accessibilityLiveRegion="polite">
                {shownError}
              </HelperText>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing("space-2"),
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing("space-2"),
  },
});
