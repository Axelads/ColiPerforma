// components/SaveBar.js
import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
// import { showInterstitialIfReady } from "../utils/interstitial"; // 🚫 Désactivé temporairement

export default function SaveBar({
  checking = false,
  editMode = true,
  saving = false,
  hasExisting = false,
  onSave,
  onEnableEdit,
}) {
  const [pressing, setPressing] = useState(false);

  const handlePress = async () => {
    if (!onSave || saving || checking) return;
    setPressing(true);
    try {
      const ok = await onSave();
      // 🚫 Désactivé pour éviter crash pub interstitielle
      // if (ok) showInterstitialIfReady();
    } finally {
      setPressing(false);
    }
  };

  return (
    <View style={{ marginTop: 20, gap: 10 }}>
      {checking ? (
        <View style={styles.pillMuted}>
          <ActivityIndicator />
          <Text style={styles.pillMutedTxt}>Chargement…</Text>
        </View>
      ) : editMode ? (
        <TouchableOpacity
          style={[styles.btn, (saving || pressing) && { opacity: 0.6 }]}
          onPress={handlePress}
          disabled={saving || pressing}
        >
          <Text style={styles.btnTxt}>{hasExisting ? "Mettre à jour" : "Enregistrer"}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btnGhost} onPress={onEnableEdit}>
          <Text style={styles.btnGhostTxt}>Modifier</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnTxt: {
    color: "#0f1115",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  btnGhost: {
    backgroundColor: "#121722",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnGhostTxt: {
    color: "#e6e9ef",
    fontSize: 15,
    fontWeight: "700",
  },
  pillMuted: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 999,
    paddingVertical: 10,
  },
  pillMutedTxt: { color: "#c9d1e1", fontWeight: "600" },
});
