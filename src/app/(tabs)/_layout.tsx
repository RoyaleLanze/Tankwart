import { useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";

import { AppBar } from "@/components/AppBar";
import { NavigationBar, tabIcon } from "@/components/NavigationBar";
import { VehicleSwitcher } from "@/components/VehicleSwitcher";
import { useActiveVehicle, useSetActiveVehicle } from "@/features/vehicles/hooks/useActiveVehicle";
import { useVehicles } from "@/features/vehicles/hooks/useVehicles";
import { SWITCH_ERROR_TEXT } from "@/features/vehicles/messages";

/** The four main screens, always in this order (design-system.md → NavigationBar). */
export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <NavigationBar {...props} />}
      screenOptions={{
        // Main screens show the vehicle switcher instead of a title; the navigation bar names
        // the screen (design-system.md → TopAppBar).
        header: () => (
          <AppBar start={<ActiveVehicleSwitcher />} onSettings={() => router.push("/settings")} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("home", "home-outline") }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "Verlauf", tabBarIcon: tabIcon("receipt-text", "receipt-text-outline") }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: "Statistik", tabBarIcon: tabIcon("chart-box", "chart-box-outline") }}
      />
      <Tabs.Screen
        name="stations"
        options={{
          title: "Tankstellen",
          tabBarIcon: tabIcon("gas-station", "gas-station-outline"),
        }}
      />
    </Tabs>
  );
}

/** Connects the switcher to the vehicle list and the stored choice (M2). */
function ActiveVehicleSwitcher() {
  const vehicles = useVehicles();
  const active = useActiveVehicle();
  const setActive = useSetActiveVehicle();
  // The root layout shows the tabs only with loaded vehicles, so this is a short gap at most.
  if (!vehicles.data || !active) return null;

  return (
    <VehicleSwitcher
      vehicles={vehicles.data}
      activeId={active.id}
      onSelect={(id) => setActive.mutate(id)}
      error={setActive.isError ? SWITCH_ERROR_TEXT : undefined}
      onDismissError={setActive.reset}
    />
  );
}
