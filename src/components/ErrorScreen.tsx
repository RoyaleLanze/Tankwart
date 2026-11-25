import { StyleSheet, View } from "react-native";
import { Button, Icon, Text } from "react-native-paper";

import { sizes, spacing, useAppTheme } from "@/lib/theme";

type Props = {
  /** Says what failed and what the user can do, e.g. "Prüfe deine Internetverbindung …". */
  message: string;
  onRetry: () => void;
  /** Shows a spinner on the button while the retry runs. */
  isRetrying: boolean;
};

const ICON_SIZE_LARGE = 48;

/** Full-screen error state with a retry button (M15). */
export function ErrorScreen({ message, onRetry, isRetrying }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon source="cloud-off-outline" size={ICON_SIZE_LARGE} color={colors.onSurfaceVariant} />
      <Text variant="bodyLarge" style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>
      <Button
        mode="contained"
        onPress={onRetry}
        loading={isRetrying}
        disabled={isRetrying}
        contentStyle={styles.buttonContent}
      >
        Erneut versuchen
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing("space-4"),
    padding: spacing("space-6"),
  },
  message: {
    textAlign: "center",
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
