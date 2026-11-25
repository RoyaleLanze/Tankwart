import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Icon, SegmentedButtons, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormTextField } from "@/components/FormTextField";
import { PasswordField } from "@/components/PasswordField";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { authFieldErrorText } from "@/features/auth/messages";
import type { AuthMode } from "@/features/auth/types";
import { radius, sizes, spacing, useAppTheme } from "@/lib/theme";

const MODE_LABELS: Record<AuthMode, string> = { signIn: "Anmelden", signUp: "Registrieren" };
const MODES: AuthMode[] = ["signIn", "signUp"];

// Paper's segments are 38 dp tappable (9 + 20 + 9); the label padding brings them to touch-min.
const PAPER_SEGMENT_TAPPABLE_HEIGHT = 38;
const SEGMENT_LABEL_PADDING = (sizes("touch-min") - PAPER_SEGMENT_TAPPABLE_HEIGHT) / 2;

// App logo as in mockup 7.1.
const LOGO_SIZE = 64;
const LOGO_ICON_SIZE = 36;

/** Login screen (mockup 7.1). The auth guard in the root layout leaves it after success. */
export default function LoginScreen() {
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const { control, setFocus, submit, isSubmitting, submitError } = useAuthForm(mode);

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

          <SegmentedButtons
            value={mode}
            onValueChange={setMode}
            buttons={MODES.map((value) => ({
              value,
              label: MODE_LABELS[value],
              // The check mark shows the selected tab without relying on color alone.
              showSelectedCheck: true,
              disabled: isSubmitting,
              labelStyle: styles.segmentLabel,
            }))}
          />

          <View style={styles.form}>
            <FormTextField
              control={control}
              name="email"
              label="E-Mail"
              errorText={authFieldErrorText}
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => setFocus("password")}
            />
            <PasswordField
              control={control}
              name="password"
              label="Passwort"
              errorText={authFieldErrorText}
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
              style={styles.submit}
              contentStyle={styles.submitContent}
            >
              {MODE_LABELS[mode]}
            </Button>
          </View>

          <Text variant="bodySmall" style={[styles.footer, { color: colors.onSurfaceVariant }]}>
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
    gap: spacing("space-6"),
    paddingHorizontal: spacing("space-6"),
    // The login screen has no app bar; its height becomes free space above the logo (mockup 7.1).
    paddingTop: sizes("top-app-bar"),
    paddingBottom: spacing("space-8"),
  },
  brand: {
    alignItems: "center",
    gap: spacing("space-3"),
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius("radius-lg"),
    alignItems: "center",
    justifyContent: "center",
  },
  segmentLabel: {
    paddingVertical: SEGMENT_LABEL_PADDING,
  },
  form: {
    gap: spacing("space-4"),
  },
  // Together with the form gap 24 dp above the button, as in mockup 7.1.
  submit: {
    marginTop: spacing("space-2"),
  },
  submitContent: {
    minHeight: sizes("touch-min"),
  },
  // Pushes the note to the bottom of the screen when there is space left.
  footer: {
    marginTop: "auto",
    textAlign: "center",
  },
});
