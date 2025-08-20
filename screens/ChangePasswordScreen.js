// screens/ChangePasswordScreen.js
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import axios from "axios";

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app";

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState("");
  const [nextPwd, setNextPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    const curr = current.trim();
    const next = nextPwd.trim();
    const conf = confirm.trim();

    if (!curr || !next || !conf) {
      Alert.alert("Oups", "Remplis tous les champs.");
      return;
    }
    if (next.length < 8) {
      Alert.alert("Oups", "Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (next !== conf) {
      Alert.alert("Oups", "La confirmation ne correspond pas.");
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("pb_token");
      const raw = await AsyncStorage.getItem("pb_model");
      const me = raw ? JSON.parse(raw) : null;

      if (!token || !me?.id) {
        throw new Error("Session expirée. Reconnecte-toi.");
      }

      const res = await axios.patch(
        `${PB_URL}/api/collections/users/records/${me.id}`,
        {
          oldPassword: curr,
          password: next,
          passwordConfirm: conf,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status >= 200 && res.status < 300) {
        Alert.alert("✅ OK", "Mot de passe changé.");
        navigation.goBack();
      }
    } catch (e) {
      const msg =
        e?.response?.data?.data
          ? Object.entries(e.response.data.data)
              .map(([k, v]) => `${k}: ${v?.message}`)
              .join("\n")
          : e?.response?.data?.message || e.message || "Échec du changement de mot de passe.";
      Alert.alert("Erreur", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <BackButton navigation={navigation} />
            <Text style={styles.titre}>Changer le mot de passe</Text>

            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={current}
              onChangeText={setCurrent}
              placeholder="********"
              placeholderTextColor="#8c9199"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
              returnKeyType="next"
            />

            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={nextPwd}
              onChangeText={setNextPwd}
              placeholder="********"
              placeholderTextColor="#8c9199"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
              returnKeyType="next"
            />

            <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              placeholder="********"
              placeholderTextColor="#8c9199"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleChange}
            />

            <TouchableOpacity
              style={[styles.btn, saving && { opacity: 0.6 }]}
              onPress={handleChange}
              disabled={saving}
            >
              <Text style={styles.btnTxt}>{saving ? "En cours..." : "Valider"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1115" },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 },
  titre: {
    fontSize: 22, fontWeight: "700", color: "#ffffff",
    textAlign: "center", marginTop: 16, marginBottom: 20,
  },
  label: { color: "#c9d1e1", fontSize: 14, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: "#1a1f29", borderWidth: 1, borderColor: "#222938",
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    color: "#e6e9ef", marginBottom: 12,
  },
  btn: {
    backgroundColor: "#22c55e", borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 16, alignItems: "center", marginTop: 8,
  },
  btnTxt: { color: "#0f1115", fontWeight: "700", fontSize: 16 },
});
