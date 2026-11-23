import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Icon, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormTextField } from "@/components/FormTextField";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import type { AuthMode } from "@/features/auth/types";
import { radius, sizes, spacing, useAppTheme } from "@/lib/theme";

const MODE_LABELS: Record<AuthMode, string> = { signIn: "Anmelden", signUp: "Registrieren" };
const MODES = (["signIn", "signUp"] as const).map((value) => ({
  value,
  label: MODE_LABELS[value],
}));

// App logo as in mockup 7.1.
const LOGO_SIZE = 64;
const LOGO_ICON_SIZE = 36;

/** Login screen (mockup 7.1). The auth guard in the root layout leaves it after success. */
export default function LoginScreen() {
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { control, submit, isSubmitting, submitError } = useAuthForm(mode);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Icon source="gas-station" size={LOGO_ICON_SIZE} color={colors.onPrimary} />
            </View>
            <Text variant="headlineMedium" accessibilityRole="header">
              Tankwart
            </Text>
            <Text variant="bodyLarge" style={{ color: colors.onSurfaceVariant }}>
              Verbrauch tracken, günstig tanken
            </Text>
          </View>

          <SegmentedButtons value={mode} onValueChange={setMode} buttons={MODES} />

          <View style={styles.form}>
            <FormTextField
              control={control}
              name="email"
              label="E-Mail"
              left={<TextInput.Icon icon="email-outline" importantForAccessibility="no" />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />
            <FormTextField
              control={control}
              name="password"
              label="Passwort"
              left={<TextInput.Icon icon="lock-outline" importantForAccessibility="no" />}
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  onPress={() => setIsPasswordVisible((visible) => !visible)}
                  accessibilityLabel={
                    isPasswordVisible ? "Passwort verbergen" : "Passwort anzeigen"
                  }
                />
              }
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            {submitError && (
              <HelperText type="error" accessibilityLiveRegion="assertive">
                {submitError}
              </HelperText>
            )}
            <Button
              mode="contained"
              onPress={submit}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={styles.submitContent}
            >
              {MODE_LABELS[mode]}
            </Button>
          </View>

          <Text variant="labelSmall" style={[styles.footer, { color: colors.onSurfaceVariant }]}>
            Deine Daten werden in der EU gespeichert.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing["space-6"],
    paddingHorizontal: spacing["space-6"],
    // The login screen has no app bar; its height becomes free space above the logo (mockup 7.1).
    paddingTop: sizes["top-app-bar"],
    paddingBottom: spacing["space-8"],
  },
  brand: {
    alignItems: "center",
    gap: spacing["space-3"],
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius["radius-lg"],
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: spacing["space-4"],
  },
  submitContent: {
    minHeight: sizes["touch-min"],
  },
  // Pushes the note to the bottom of the screen when there is space left.
  footer: {
    marginTop: "auto",
    textAlign: "center",
  },
});
