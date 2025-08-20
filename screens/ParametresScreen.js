import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../components/BackButton";
import LogoutButton from "../components/LogoutButton";

export default function ParametresScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <BackButton navigation={navigation} />

        <Text style={styles.titre}>Paramètres</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ProfileEdit")}
            activeOpacity={0.8}
          >
            <Text style={styles.btnTxt}>Modifier mon profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ChangePassword")}
            activeOpacity={0.8}
          >
            <Text style={styles.btnTxt}>Changer le mot de passe</Text>
          </TouchableOpacity>
        </View>

        <LogoutButton navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f1115",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titre: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 40,
  },
  btn: {
    backgroundColor: "#1a1f29",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  btnTxt: {
    color: "#e6e9ef",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
