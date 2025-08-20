// screens/LoginScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import AdBanner from "../utils/AdBanner"; // 🚫 Désactivé temporairement
import axios from "axios";

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app"; // ← adapte si besoin

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passRef = useRef(null);

  const handleLogin = async () => {
    const identity = username.trim();
    const pwd = password;

    if (!identity || !pwd) {
      Alert.alert(
        "Champs requis",
        !identity && !pwd
          ? "Veuillez renseigner l'email et le mot de passe."
          : !identity
          ? "Veuillez renseigner votre email."
          : "Veuillez renseigner votre mot de passe."
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await axios.post(
        `${PB_URL}/api/collections/users/auth-with-password`,
        { identity, password: pwd },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000, // ⏳ évite le crash Android si timeout null
        }
      );

      const data = res?.data ?? {};

      // Gestion d'erreur côté HTTP (peu probable ici car axios jette déjà sur !2xx)
      if (res.status < 200 || res.status >= 300) {
        let msg = "Email ou mot de passe incorrect.";
        if (data?.data?.identity?.code === "validation_required" || data?.data?.password?.code === "validation_required") {
          msg = "Veuillez renseigner l'email et le mot de passe.";
        } else if (typeof data?.message === "string" && data.message.length) {
          msg = data.message.includes("authenticate") ? "Email ou mot de passe incorrect." : data.message;
        }
        throw new Error(msg);
      }

      if (data?.token) {
        await AsyncStorage.setItem("pb_token", String(data.token));
      }
      if (data?.record) {
        await AsyncStorage.setItem("pb_model", JSON.stringify(data.record));
      }

      Alert.alert("Succès", "Connexion réussie !");
      navigation.replace("Home");
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Une erreur est survenue.";
      Alert.alert("Connexion impossible", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1115" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={{ flex: 1, backgroundColor: "#0f1115" }}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            {/* 🚫 Bannière pub désactivée temporairement */}
            {/* <AdBanner /> */}

            {/* Logo */}
            <Image
              source={require("../../assets/logo_ColisPerforma.png")}
              style={styles.logo}
              resizeMode="contain"
            />  

            <Text style={styles.title}>Connexion</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              blurOnSubmit={false}
              textContentType="username"
            />

            <TextInput
              ref={passRef}
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              textContentType="password"
            />

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.8 }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Se connecter</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.link}>Créer un compte</Text>
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footer}>Propulsé by Axel Gregoire © 2025</Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    backgroundColor: "#0f1115",
  },
  logo: { width: 350, height: 350, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  input: {
    backgroundColor: "#1a1f29",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    width: "100%",
    padding: 12,
    marginBottom: 12,
    color: "#fff",
  },
  button: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: "#4CAF50", marginBottom: 20 },
  footer: { marginTop: 10, fontSize: 12, color: "#888", textAlign: "center" },
});
