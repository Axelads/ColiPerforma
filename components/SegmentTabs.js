import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function SegmentTabs({ tabs, activeKey, onChange }) {
  return (
    <View style={styles.wrap}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tab, active && styles.active]}
          >
            <Text style={[styles.txt, active && styles.txtActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#121722",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  active: {
    backgroundColor: "#1a1f29",
    borderWidth: 1,
    borderColor: "#2a3344",
  },
  txt: { color: "#9aa5b1", fontWeight: "600" },
  txtActive: { color: "#e6e9ef" },
});
