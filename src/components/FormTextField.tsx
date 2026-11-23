import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { View } from "react-native";
import { HelperText, TextInput, type TextInputProps } from "react-native-paper";

export type FormTextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  /** Visible label of the field, also read by the screen reader. */
  label: string;
  /** Decorative icon at the start of the field, e.g. "email-outline". */
  icon?: string;
} & Omit<
  TextInputProps,
  "mode" | "label" | "value" | "onChangeText" | "onBlur" | "error" | "left" | "ref"
>;

/**
 * Outlined text field bound to react-hook-form. Shows the field's validation error below it
 * (design-system.md → TextField).
 */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  icon,
  ...inputProps
}: FormTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <View>
          <TextInput
            {...inputProps}
            // Lets react-hook-form focus the field, e.g. the first invalid one after submitting.
            ref={field.ref}
            mode="outlined"
            label={label}
            // Paper's label is a separate text view; the native field needs its own name.
            accessibilityLabel={label}
            accessibilityHint={error?.message}
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
          {error && (
            <HelperText type="error" accessibilityLiveRegion="polite">
              {error.message}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}
