// components/PalettesTotalsBar.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PalettesTotalsBar({ totalColis, totalPalettes, isToday }) {
  return (
    <View style={styles.bar}>
      <Item label="Total colis" value={totalColis} />
      <Item label="Nb palettes" value={totalPalettes} />
      <Item label="Jour" value={isToday ? "Aujourd'hui" : "Sélection"} />
    </View>
  );
}

function Item({ label, value }) {
  return (
    <View style={styles.item}>
      <Text style={styles.lbl}>{label}</Text>
      <Text style={styles.val}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#0f1115",
    borderTopWidth: 1, borderColor: "#222938",
    paddingVertical: 10, paddingHorizontal: 12,
    gap: 12, justifyContent: "space-between",
  },
  item: { alignItems: "center", flex: 1, paddingVertical: 4, borderWidth: 1, borderColor: "#222938", borderRadius: 10, backgroundColor: "#121722" },
  lbl: { color: "#9aa5b1", fontSize: 12 },
  val: { color: "#ffffff", fontSize: 16, fontWeight: "800", marginTop: 2 },
});
