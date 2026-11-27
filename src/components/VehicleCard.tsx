import { useState } from "react";
import { StyleSheet } from "react-native";
import { Avatar, Card, IconButton, Menu } from "react-native-paper";

import { FUEL_TYPE_LABELS } from "@/features/vehicles/messages";
import type { Vehicle } from "@/features/vehicles/types";
import { radius, sizes, useAppTheme } from "@/lib/theme";

type Props = {
  vehicle: Vehicle;
  onEdit: () => void;
};

const AVATAR_SIZE = 44;

/** One vehicle in the list (mockup 7.10): name, plate and fuel, actions in the ⋮ menu. */
export function VehicleCard({ vehicle, onEdit }: Props) {
  const { colors } = useAppTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // "WES-GT 740 · Diesel", or only the fuel when there is no plate.
  const details = [vehicle.licensePlate, FUEL_TYPE_LABELS[vehicle.fuelType]]
    .filter(Boolean)
    .join(" · ");

  function select(action: () => void) {
    setIsMenuOpen(false);
    action();
  }

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Title
        title={vehicle.name}
        titleVariant="titleMedium"
        // Large font sizes wrap instead of cutting off the fuel type.
        titleNumberOfLines={2}
        subtitleNumberOfLines={2}
        subtitle={details}
        subtitleStyle={{ color: colors.onSurfaceVariant }}
        left={() => (
          <Avatar.Icon
            icon="car-outline"
            size={AVATAR_SIZE}
            color={colors.onSurface}
            style={{ backgroundColor: colors.surfaceVariant }}
            importantForAccessibility="no-hide-descendants"
          />
        )}
        leftStyle={styles.avatar}
        right={() => (
          <Menu
            visible={isMenuOpen}
            onDismiss={() => setIsMenuOpen(false)}
            // Paper's default is English; TalkBack reads it on Android.
            overlayAccessibilityLabel="Menü schließen"
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setIsMenuOpen(true)}
                accessibilityLabel={`Optionen für ${vehicle.name}`}
                accessibilityState={{ expanded: isMenuOpen }}
                style={styles.menuButton}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil-outline"
              title="Bearbeiten"
              onPress={() => select(onEdit)}
            />
          </Menu>
        )}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius("radius-lg"),
  },
  // Paper reserves 40 dp for the left element; the mockup's avatar is 44 dp.
  avatar: {
    width: AVATAR_SIZE,
  },
  // Paper's icon button is 40 dp. Its hitSlop does not work on Android, because the button
  // clips its content (overflow hidden), so the button itself gets touch-min (tested on device).
  menuButton: {
    width: sizes("touch-min"),
    height: sizes("touch-min"),
    borderRadius: radius("radius-full"),
  },
});
