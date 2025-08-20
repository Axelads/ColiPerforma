import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

export default function BackButton({ navigation, label = "Retour", onPress }) {
  const handlePress = () => {
    if (onPress) onPress();
    else if (navigation?.canGoBack?.()) navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.icon}>←</Text>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1f29",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  icon: {
    color: "#e6e9ef",
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    color: "#e6e9ef",
    fontWeight: "700",
    fontSize: 14,
  },
});
