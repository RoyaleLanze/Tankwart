import { StyleSheet, View } from "react-native";
import { Button, Dialog, Icon, Portal, Text } from "react-native-paper";

import { ICON_SIZE, sizes, spacing, useAppTheme } from "@/lib/theme";

type Props = {
  visible: boolean;
  /** The question, e.g. "„Golf“ löschen?". */
  title: string;
  /** What is lost with it. */
  message: string;
  /** Error of the last attempt. The dialog stays open, so the user can try again. */
  error?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

/**
 * Asks before deleting (design system: "Löschen" always opens a confirmation). Dialogs are
 * tinted (elevation level 3, ADR 0013), so every text stays on-surface and the delete button
 * uses error-container. Red text would fall below 4.5:1 there in dark mode.
 */
export function ConfirmDeleteDialog(props: Props) {
  const { visible, title, message, error, isDeleting, onConfirm, onDismiss } = props;
  const { colors } = useAppTheme();

  return (
    <Portal>
      {/* No closing while the request runs, so the user still sees an error. */}
      <Dialog visible={visible} onDismiss={onDismiss} dismissable={!isDeleting}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodyMedium">{message}</Text>
          {error && (
            <View style={styles.error} accessibilityLiveRegion="assertive">
              <Icon source="alert-circle-outline" size={ICON_SIZE} color={colors.error} />
              <Text variant="bodyMedium" style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isDeleting} contentStyle={styles.buttonContent}>
            Abbrechen
          </Button>
          <Button
            mode="contained"
            buttonColor={colors.errorContainer}
            textColor={colors.onErrorContainer}
            onPress={onConfirm}
            loading={isDeleting}
            disabled={isDeleting}
            contentStyle={styles.buttonContent}
          >
            Löschen
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing("space-3"),
  },
  error: {
    flexDirection: "row",
    gap: spacing("space-2"),
  },
  errorText: {
    flex: 1,
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
