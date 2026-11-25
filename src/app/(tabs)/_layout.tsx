import { useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";

import { AppBar } from "@/components/AppBar";
import { NavigationBar, tabIcon } from "@/components/NavigationBar";

/** The four main screens, always in this order (design-system.md → NavigationBar). */
export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      tabBar={(props) => <NavigationBar {...props} />}
      screenOptions={{
        header: ({ options }) => (
          <AppBar title={options.title ?? ""} onSettings={() => router.push("/settings")} />
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
