import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import type { ColorValue } from "react-native";
import { BottomNavigation } from "react-native-paper";

import { ICON_SIZE } from "@/lib/theme";

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
  const focusedKey = state.routes[state.index].key;
  return (
    <BottomNavigation.Bar
      navigationState={state}
      safeAreaInsets={insets}
      onTabPress={({ route, preventDefault }) => {
        // Same as Expo Router's default tab bar: emit the event, then switch tabs
        // unless a screen prevented it or the tab is already active.
        const event = emitter.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) {
          preventDefault();
        } else if (route.key !== focusedKey) {
          navigateToTab(route.key);
        }
      }}
      onTabLongPress={({ route }) => emitter.emit({ type: "tabLongPress", target: route.key })}
      renderIcon={({ route, focused, color }) =>
        descriptors[route.key].options.tabBarIcon?.({ focused, color, size: ICON_SIZE }) ?? null
      }
      getLabelText={({ route }) => descriptors[route.key].options.title}
      // Without an explicit label, Android merges the icon glyph into what TalkBack reads.
      getAccessibilityLabel={({ route }) => descriptors[route.key].options.title}
    />
  );
}
