import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { LoadingScreen } from "@/components/LoadingScreen";
import { VehicleCard } from "@/components/VehicleCard";
import { useDeleteVehicle } from "@/features/vehicles/hooks/useDeleteVehicle";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import {
  DELETE_ERROR_TEXT,
  DELETE_VEHICLE_MESSAGE,
  deleteVehicleTitle,
} from "@/features/vehicles/messages";
import type { Vehicle } from "@/features/vehicles/types";
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
  const deletion = useDeleteVehicle();
  // The vehicle whose deletion waits for confirmation; null while the dialog is closed.
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);

  function closeDialog() {
    setToDelete(null);
    deletion.reset(); // An old error must not show up in the next dialog.
  }

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
            onDelete={() => setToDelete(item)}
          />
        )}
        contentContainerStyle={styles.list}
      />
      {/* Mounted only with a vehicle, so closing never shows an empty name. Deleting the last
          vehicle leaves this screen: the root guard leads to the onboarding (M1). */}
      {toDelete && (
        <ConfirmDeleteDialog
          visible
          title={deleteVehicleTitle(toDelete.name)}
          message={DELETE_VEHICLE_MESSAGE}
          error={deletion.isError ? DELETE_ERROR_TEXT : undefined}
          isDeleting={deletion.isPending}
          onConfirm={() => deletion.mutate(toDelete.id, { onSuccess: closeDialog })}
          onDismiss={closeDialog}
        />
      )}
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
