// components/LogoutButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LogoutButton({ navigation, label = "Se déconnecter" }) {
  const handleLogout = async () => {
    try {
      // Efface toutes les clés potentielles de session
      await AsyncStorage.removeItem("pb_token");     // clé principale si tu l’utilises
      await AsyncStorage.removeItem("userToken");    // au cas où tu l’aies utilisée avant
      await AsyncStorage.removeItem("pb_model");     // si tu décides d’y stocker le user
      await AsyncStorage.removeItem("userContrat");  // si tu stockes ça côté client

      // Optionnel : petit feedback
      // Alert.alert("Déconnexion", "Votre session a été fermée.");

      // Redirection vers Login (et on remplace l'historique)
      navigation.replace("Login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      Alert.alert("Erreur", "Impossible de déconnecter.");
    }
  };

  return (
    <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
      <Text style={styles.btnTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btnLogout: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  btnTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
