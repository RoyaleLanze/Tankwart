import { StyleSheet, View } from "react-native";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { RefuelingFab } from "@/components/RefuelingFab";

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <PlaceholderScreen />
      <RefuelingFab />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
