import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingScreen } from "@/components/LoadingScreen";
import { VehicleCard } from "@/components/VehicleCard";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { sizes, spacing, useAppTheme } from "@/lib/theme";

/**
 * Managing the vehicles (M1, mockup 7.10). The root layout opens it only with a loaded list
 * of at least one vehicle. Without one, the user is in the onboarding (the empty state), and
 * a failed load shows the root error screen.
 */
export default function VehiclesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data: vehicles } = useVehicles();

  // Only a fallback: the root guard already waits for the list.
  if (!vehicles) return <LoadingScreen label="Fahrzeuge werden geladen …" />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={vehicles}
        keyExtractor={(vehicle) => vehicle.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onEdit={() => router.push({ pathname: "/vehicles/[id]", params: { id: item.id } })}
          />
        )}
        contentContainerStyle={styles.list}
      />
      {/* Fixed at the bottom like in the mockup; the app is drawn edge to edge. */}
      <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant },
        ]}
      >
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push("/vehicles/new")}
          contentStyle={styles.buttonContent}
        >
          Fahrzeug hinzufügen
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    gap: spacing("space-3"),
    padding: spacing("space-4"),
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing("space-4"),
    paddingTop: spacing("space-3"),
    paddingBottom: spacing("space-3"),
  },
  buttonContent: {
    minHeight: sizes("touch-min"),
  },
});
