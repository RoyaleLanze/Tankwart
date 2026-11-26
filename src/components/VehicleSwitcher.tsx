import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { Chip, Menu, Portal, Snackbar } from "react-native-paper";

import { CHIP_HIT_SLOP, sizes, useAppTheme } from "@/lib/theme";

type Option = { id: string; name: string };

type Props = {
  vehicles: readonly Option[];
  /** The vehicle shown in the chip; one of `vehicles`. */
  active: Option;
  onSelect: (id: string) => void;
  /** Shown as a message below the screen, e.g. when saving the choice failed. */
  error?: string;
  onDismissError: () => void;
  /** Tries the failed choice again; the message offers it as an action. */
  onRetry: () => void;
};

// Paper draws chip icons at 18 dp; the dropdown arrow matches the car icon and the label color.
const CHIP_ICON_SIZE = 18;

/**
 * Chip with the active vehicle's name that opens a menu of all vehicles (M2,
 * design-system.md → TopAppBar). The active one is marked with a check mark, not only a color.
 */
export function VehicleSwitcher({
  vehicles,
  active,
  onSelect,
  error,
  onDismissError,
  onRetry,
}: Props) {
  const { colors } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  function select(id: string) {
    setIsOpen(false);
    onSelect(id);
  }

  return (
    <>
      <Menu
        visible={isOpen}
        onDismiss={() => setIsOpen(false)}
        anchorPosition="bottom"
        // Paper adds the status bar height on Android, but with edge-to-edge (Expo SDK 58) the
        // measured anchor position already contains it. Without this the menu opens too low.
        statusBarHeight={0}
        anchor={
          <Chip
            icon="car"
            onPress={() => setIsOpen(true)}
            hitSlop={CHIP_HIT_SLOP}
            // The chip stays clear of the gear. A long name shrinks and is shortened in the middle,
            // so the arrow at its end stays visible.
            textStyle={styles.label}
            style={styles.chip}
            ellipsizeMode="middle"
            accessibilityLabel={`Aktives Fahrzeug: ${active.name}. Fahrzeug wechseln`}
          >
            {/* The icon font renders inside the chip's label text, so the arrow follows the name.
                TalkBack reads the label above instead. */}
            {`${active.name} `}
            <MaterialCommunityIcons
              name="menu-down"
              size={CHIP_ICON_SIZE}
              color={colors.onSecondaryContainer}
            />
          </Chip>
        }
      >
        {vehicles.map((vehicle) => {
          const isActive = vehicle.id === active.id;
          return (
            <Menu.Item
              key={vehicle.id}
              title={vehicle.name}
              // At the end, so the names stay aligned whether they have a check mark or not.
              trailingIcon={isActive ? "check" : undefined}
              onPress={() => select(vehicle.id)}
              accessibilityState={{ selected: isActive }}
            />
          );
        })}
      </Menu>
      {/* The portal shows the message at the bottom instead of inside the app bar. The switcher
          is only on the main screens, so it is lifted above their navigation bar. */}
      <Portal>
        <Snackbar
          visible={error !== undefined}
          onDismiss={onDismissError}
          action={{ label: "Erneut versuchen", onPress: onRetry }}
          wrapperStyle={styles.snackbar}
        >
          {error ?? ""}
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: { maxWidth: "100%" },
  label: { flexShrink: 1 },
  // Paper adds the bottom safe area itself.
  snackbar: { bottom: sizes("navigation-bar") },
});
