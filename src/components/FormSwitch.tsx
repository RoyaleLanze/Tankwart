import { Controller, type Control, type FieldPathByValue, type FieldValues } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Switch, Text, TouchableRipple } from "react-native-paper";

import { sizes, spacing, useAppTheme } from "@/lib/theme";

type Props<T extends FieldValues, TTransformed> = {
  control: Control<T, unknown, TTransformed>;
  /** Must be a boolean field. */
  name: FieldPathByValue<T, boolean>;
  /** Visible label, also read by the screen reader. */
  label: string;
  /** Explains what the switch changes; shown below the label. */
  description?: string;
};

/** On/off setting bound to react-hook-form. The whole row is the touch target (≥ 48 dp). */
export function FormSwitch<T extends FieldValues, TTransformed = T>({
  control,
  name,
  label,
  description,
}: Props<T, TTransformed>) {
  const { colors } = useAppTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TouchableRipple
          onPress={() => field.onChange(!field.value)}
          accessibilityRole="switch"
          accessibilityState={{ checked: field.value === true }}
          accessibilityLabel={label}
          accessibilityHint={description}
          style={styles.row}
        >
          <View style={styles.content}>
            <View style={styles.texts}>
              <Text variant="bodyLarge">{label}</Text>
              {description && (
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {description}
                </Text>
              )}
            </View>
            {/* The row handles the touch; the switch only shows the state. */}
            <Switch
              value={field.value === true}
              style={styles.switch}
              importantForAccessibility="no"
              // Paper's grey off track has no 3:1 contrast on the surface; use theme colors.
              trackColor={{ true: colors.primary, false: colors.outline }}
              thumbColor={field.value === true ? colors.onPrimary : colors.surface}
            />
          </View>
        </TouchableRipple>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes("touch-min"),
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing("space-4"),
  },
  texts: {
    flex: 1,
  },
  switch: {
    pointerEvents: "none",
  },
});
