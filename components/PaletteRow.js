// components/PaletteRow.js
import React from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function PaletteRow({
  label, colis,
  onChangeLabel, onChangeColis,
  onSave, onDelete, savingHint
}) {
  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder="Nom palette (ex: Alfa)"
        placeholderTextColor="#8c9199"
        value={label}
        onChangeText={onChangeLabel}
      />
      <TextInput
        style={[styles.input, { width: 90, textAlign: "center" }]}
        placeholder="Colis"
        placeholderTextColor="#8c9199"
        value={String(colis ?? "")}
        onChangeText={(v) => onChangeColis(v.replace(/[^\d]/g, ""))}
        keyboardType="number-pad"
      />
      <TouchableOpacity style={styles.btn} onPress={onSave}>
        <Text style={styles.btnTxt}>{savingHint ? "Créer" : "Sauver"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnDel} onPress={onDelete}>
        <Text style={styles.btnDelTxt}>Suppr.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    backgroundColor: "#1a1f29",
    borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12,
    color: "#e6e9ef",
  },
  btn: { backgroundColor: "#22c55e", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  btnTxt: { color: "#0f1115", fontWeight: "700", fontSize: 12 },
  btnDel: { backgroundColor: "#1f2937", borderWidth: 1, borderColor: "#374151", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  btnDelTxt: { color: "#e6e9ef", fontWeight: "700", fontSize: 12 },
});
