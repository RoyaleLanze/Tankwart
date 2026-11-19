import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";
import { BottomNavigation } from "react-native-paper";

import { useAppTheme } from "@/lib/theme";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Tab icon that is filled when active and outlined otherwise (design-system.md → NavigationBar). */
export function tabIcon(filled: IconName, outlined: IconName) {
  function TabIcon({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: ColorValue;
    size: number;
  }) {
    return (
      <MaterialCommunityIcons
        name={focused ? filled : outlined}
        color={typeof color === "string" ? color : undefined}
        size={size}
      />
    );
  }
  return TabIcon;
}

/** Paper's M3 navigation bar as the tab bar of Expo Router's tabs. */
export function NavigationBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { colors } = useAppTheme();
  return (
    <BottomNavigation.Bar
      style={{ backgroundColor: colors.surface }}
      navigationState={state}
      safeAreaInsets={insets}
      onTabPress={({ route, preventDefault }) => {
        // Same order as Expo Router's default tab bar: emit the event, then navigate unless prevented.
        const event = emitter.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) {
          preventDefault();
        } else {
          navigateToTab(route.key);
        }
      }}
      renderIcon={({ route, focused, color }) =>
        descriptors[route.key].options.tabBarIcon?.({ focused, color, size: 24 }) ?? null
      }
      getLabelText={({ route }) => descriptors[route.key].options.title}
    />
  );
}
