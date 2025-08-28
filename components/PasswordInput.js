// components/PasswordInput.js
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PasswordInput({ value, onChangeText, placeholder = "Mot de passe", inputRef }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.passwordContainer}>
      <TextInput
        ref={inputRef}
        style={styles.passwordInput}
        placeholder={placeholder}
        placeholderTextColor="#8c9199"
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="done"
        textContentType="password"
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={() => setShowPassword(!showPassword)}
      >
        <Ionicons
          name={showPassword ? "eye-off" : "eye"}
          size={20}
          color="#8c9199"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1f29",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    color: "#fff",
    padding: 12,
  },
  eyeIcon: {
    padding: 8,
  },
});
