import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { HelperText, Icon, TextInput, type TextInputProps } from "react-native-paper";

import { spacing } from "@/lib/theme";

/** Size of the icon before a hint; matches the hint text. */
const ICON_SIZE = 16;

// TTransformed: the values after validation, when the schema turns the text into other types.
export type FormTextFieldProps<T extends FieldValues, TTransformed = T> = {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  /** Visible label of the field, also read by the screen reader. */
  label: string;
  /** Decorative icon at the start of the field, e.g. "email-outline". */
  icon?: string;
  /** Turns a validation code from the schema into the text shown to the user (ADR 0014). */
  errorText: (message: string) => string;
  /** Hint below the field while it has no error, e.g. what the value is used for. */
  helperText?: string;
  /** Color of the hint, e.g. the warning color; the default is the neutral hint color. */
  helperColor?: string;
  /** Icon before the hint, so a warning never relies on its color alone. */
  helperIcon?: string;
  /**
   * Announces the hint when it changes, e.g. a computed value. Without it the hint is a static
   * accessibility hint of the field.
   */
  helperLive?: boolean;
} & Omit<
  TextInputProps,
  "mode" | "label" | "value" | "onChangeText" | "onBlur" | "error" | "left" | "ref"
>;

/**
 * Outlined text field bound to react-hook-form. Shows the field's validation error below it
 * (design-system.md → TextField).
 */
export function FormTextField<T extends FieldValues, TTransformed = T>({
  control,
  name,
  label,
  icon,
  errorText,
  helperText,
  helperColor,
  helperIcon,
  helperLive,
  ...inputProps
}: FormTextFieldProps<T, TTransformed>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const shownError = error && errorText(error.message ?? "");
        return (
          <View>
            <TextInput
              {...inputProps}
              // Lets react-hook-form focus the field, e.g. the first invalid one after submitting.
              ref={field.ref}
              mode="outlined"
              label={label}
              // Paper's label is a separate text view; the native field needs its own name.
              accessibilityLabel={label}
              accessibilityHint={helperLive ? undefined : helperText}
              left={
                icon ? (
                  <TextInput.Icon icon={icon} importantForAccessibility="no" focusable={false} />
                ) : undefined
              }
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={error !== undefined}
            />
            {/* Always mounted: a live region only announces changes below a node that exists. */}
            <View accessibilityLiveRegion={helperLive && !shownError ? "polite" : undefined}>
              {shownError ? (
                <HelperText type="error" accessibilityLiveRegion="polite">
                  {shownError}
                </HelperText>
              ) : (
                helperText && (
                  <View style={styles.hint}>
                    {helperIcon && (
                      <View style={styles.hintIcon} importantForAccessibility="no">
                        <Icon source={helperIcon} size={ICON_SIZE} color={helperColor} />
                      </View>
                    )}
                    <HelperText
                      type="info"
                      // Without helperLive the text is the field's hint; hide the node, so it is not read twice.
                      importantForAccessibility={helperLive ? "auto" : "no"}
                      style={[styles.hintText, helperColor ? { color: helperColor } : undefined]}
                    >
                      {helperText}
                    </HelperText>
                  </View>
                )
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    // HelperText has its own horizontal padding of the same size.
    paddingLeft: spacing("space-3"),
  },
  // Lines up with the first line of the hint text, which has the same padding on top.
  hintIcon: {
    paddingTop: spacing("space-1"),
  },
  hintText: {
    flex: 1,
    paddingLeft: spacing("space-1"),
  },
});
