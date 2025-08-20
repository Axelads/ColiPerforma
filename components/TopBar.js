import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function TopBar({ onLeftPress }) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={onLeftPress} style={styles.left}>
        <Text style={styles.icon}>⚙️</Text>
      </TouchableOpacity>
      <Text style={styles.title}>ColiPerforma</Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  left: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20, color: "#e6e9ef" },
  title: { flex: 1, textAlign: "center", color: "#fff", fontSize: 18, fontWeight: "700" },
});
