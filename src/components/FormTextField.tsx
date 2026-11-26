import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { View } from "react-native";
import { HelperText, TextInput, type TextInputProps } from "react-native-paper";

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
              accessibilityHint={shownError ?? helperText}
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
            {shownError ? (
              <HelperText type="error" accessibilityLiveRegion="polite">
                {shownError}
              </HelperText>
            ) : (
              helperText && (
                // Already read as the field's hint, so the screen reader skips it here.
                <HelperText type="info" importantForAccessibility="no">
                  {helperText}
                </HelperText>
              )
            )}
          </View>
        );
      }}
    />
  );
}
