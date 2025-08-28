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
import PasswordInput from "../components/PasswordInput";

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app/";


// --- Helpers (robustesse booleans) ---
const toBool = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return !!v;
};

// Normalise ce qu’on connaît potentiellement comme bool dans user record.
// (On reste conservateur : on ne touche qu’aux champs qui posent classiquement souci)
const normalizeRecord = (rec = {}) => {
  const out = { ...rec };
  // champs PocketBase fréquents
  if ("verified" in out) out.verified = toBool(out.verified);
  if ("emailVisibility" in out) out.emailVisibility = toBool(out.emailVisibility);
  if ("isAdmin" in out) out.isAdmin = toBool(out.isAdmin);
  // si tu ajoutes d'autres flags dans users plus tard, ajoute-les ici :
  // if ('someFlag' in out) out.someFlag = toBool(out.someFlag);
  return out;
};

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

      // (Par sécurité — axios throw déjà sur codes non-2xx)
      if (res.status < 200 || res.status >= 300) {
        let msg = "Email ou mot de passe incorrect.";
        if (
          data?.data?.identity?.code === "validation_required" ||
          data?.data?.password?.code === "validation_required"
        ) {
          msg = "Veuillez renseigner l'email et le mot de passe.";
        } else if (typeof data?.message === "string" && data.message.length) {
          msg = data.message.includes("authenticate")
            ? "Email ou mot de passe incorrect."
            : data.message;
        }
        throw new Error(msg);
      }

      if (data?.token) {
        await AsyncStorage.setItem("pb_token", String(data.token));
      }

      if (data?.record) {
        // 💡 on normalise (notamment booleans) avant de stocker
        const normalized = normalizeRecord(data.record);
        await AsyncStorage.setItem("pb_model", JSON.stringify(normalized));
      } else {
        // par prudence, on évite de laisser un vieux modèle en cache si pas renvoyé
        await AsyncStorage.removeItem("pb_model");
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

      // En cas d’échec, on nettoie la session pour éviter un cache incohérent
      try {
        await AsyncStorage.multiRemove(["pb_token", "pb_model"]);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1115" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
              source={require("../assets/logo_ColisPerforma.png")}
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

            <PasswordInput
              inputRef={passRef}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.8 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
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
