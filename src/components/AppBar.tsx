import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Appbar } from "react-native-paper";

import { spacing } from "@/lib/theme";

type Props = {
  /** Sub-pages: the one title of the screen. */
  title?: string;
  /** Main screens: shown at the start instead of a title, e.g. the vehicle switcher. */
  start?: ReactNode;
  /** Shows a back arrow (sub-pages). */
  onBack?: () => void;
  /** Shows the settings gear (main screens). */
  onSettings?: () => void;
};

/** Top app bar with exactly one title or the vehicle switcher (design-system.md → TopAppBar). */
export function AppBar({ title, start, onBack, onSettings }: Props) {
  return (
    <Appbar.Header>
      {onBack && <Appbar.BackAction onPress={onBack} accessibilityLabel="Zurück" />}
      {start ? <View style={styles.start}>{start}</View> : <Appbar.Content title={title ?? ""} />}
      {onSettings && (
        <Appbar.Action icon="cog-outline" onPress={onSettings} accessibilityLabel="Einstellungen" />
      )}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  // Takes the free width like Appbar.Content, so the gear stays at the end.
  start: {
    flex: 1,
    alignItems: "flex-start",
    paddingHorizontal: spacing("space-2"),
  },
});
