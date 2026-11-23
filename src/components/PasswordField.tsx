import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { TextInput } from "react-native-paper";

import { FormTextField, type FormTextFieldProps } from "./FormTextField";

/** Password field with a button that shows or hides the typed password (mockup 7.1). */
export function PasswordField<T extends FieldValues>(props: FormTextFieldProps<T>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormTextField
      icon="lock-outline"
      {...props}
      right={
        <TextInput.Icon
          icon={isVisible ? "eye-off-outline" : "eye-outline"}
          onPress={() => setIsVisible((visible) => !visible)}
          accessibilityLabel={isVisible ? "Passwort verbergen" : "Passwort anzeigen"}
        />
      }
      secureTextEntry={!isVisible}
      // Tells the keyboard that a shown password is still a password, so it is not learned.
      keyboardType={isVisible ? "visible-password" : "default"}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}
