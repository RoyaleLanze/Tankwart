import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { View } from "react-native";
import { HelperText, TextInput, type TextInputProps } from "react-native-paper";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  /** Visible label of the field, also read by the screen reader. */
  label: string;
} & Omit<TextInputProps, "mode" | "label" | "value" | "onChangeText" | "onBlur" | "error">;

/**
 * Outlined text field bound to react-hook-form. Shows the field's validation error below it
 * (design-system.md → TextField).
 */
export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <View>
          <TextInput
            {...inputProps}
            mode="outlined"
            label={label}
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
