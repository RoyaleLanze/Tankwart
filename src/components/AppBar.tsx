import { Appbar } from "react-native-paper";

type Props = {
  title: string;
  /** Shows a back arrow (sub-pages). */
  onBack?: () => void;
  /** Shows the settings gear (main screens). */
  onSettings?: () => void;
};

/** Top app bar with exactly one title (design-system.md → TopAppBar). */
export function AppBar({ title, onBack, onSettings }: Props) {
  return (
    <Appbar.Header>
      {onBack && <Appbar.BackAction onPress={onBack} accessibilityLabel="Zurück" />}
      <Appbar.Content title={title} />
      {onSettings && (
        <Appbar.Action icon="cog-outline" onPress={onSettings} accessibilityLabel="Einstellungen" />
      )}
    </Appbar.Header>
  );
}
