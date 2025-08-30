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

// ⚠️ évite le slash final pour ne pas générer //api/...
const PB_URL_RAW = "https://cooing-emalee-axelads-7ec4b898.koyeb.app/";
const PB_URL = PB_URL_RAW.replace(/\/+$/, "");

const log = (...args) => console.log("[LoginScreen]", ...args);

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
  const out = { ...rec }; // ⚠️ bien ...rec (et pas .rec)
  if ("verified" in out) out.verified = toBool(out.verified);
  if ("emailVisibility" in out) out.emailVisibility = toBool(out.emailVisibility);
  if ("isAdmin" in out) out.isAdmin = toBool(out.isAdmin);
  return out;
};

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passRef = useRef(null);

  const handleLogin = async () => {
    const identity = String(username || "").trim();
    const pwd = String(password || "");

    log("handleLogin called", { identityLength: identity.length, pwdLength: pwd.length });
    log("PB_URL resolved:", PB_URL);

    if (!identity || !pwd) {
      const msg = !identity && !pwd
        ? "Veuillez renseigner l'email et le mot de passe."
        : !identity
        ? "Veuillez renseigner votre email."
        : "Veuillez renseigner votre mot de passe.";
      log("Missing fields -> abort", { identityOk: !!identity, pwdOk: !!pwd });
      Alert.alert("Champs requis", msg);
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      const url = `${PB_URL}/api/collections/users/auth-with-password`;
      log("POST auth-with-password", { url, identityPreview: identity, hasPwd: !!pwd });

      const res = await axios.post(
        url,
        { identity, password: pwd },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      const data = res?.data ?? {};
      log("HTTP status:", res?.status);
      log("Response keys:", Object.keys(data || {}));

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
        log("Non-2xx status -> throw", { msg });
        throw new Error(msg);
      }

      if (data?.token) {
        log("Saving token to AsyncStorage (pb_token length)", String(data.token).length);
        await AsyncStorage.setItem("pb_token", String(data.token));
      } else {
        log("No token present in response");
      }

      if (data?.record) {
        const normalized = normalizeRecord(data.record);
        log("Record received", {
          id: normalized?.id,
          email: normalized?.email,
          verified: normalized?.verified,
          isAdmin: normalized?.isAdmin,
        });
        await AsyncStorage.setItem("pb_model", JSON.stringify(normalized));
      } else {
        log("No record in response -> remove pb_model");
        await AsyncStorage.removeItem("pb_model");
      }

      log("Login success -> navigating to Home");
      Alert.alert("Succès", "Connexion réussie !");
      navigation.replace("Home");
    } catch (err) {
      const axiosStatus = err?.response?.status;
      const axiosData = err?.response?.data;
      log("Login error CATCH", {
        name: err?.name,
        message: err?.message,
        axiosStatus,
        axiosData,
      });

      const msg =
        axiosData?.message ||
        err?.message ||
        "Une erreur est survenue.";
      Alert.alert("Connexion impossible", msg);

      try {
        log("Cleaning session (pb_token, pb_model)");
        await AsyncStorage.multiRemove(["pb_token", "pb_model"]);
      } catch (cleanupErr) {
        log("Cleanup error", cleanupErr);
      }
    } finally {
      setLoading(false);
      log("handleLogin finished");
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
            {/* <AdBanner /> */}

            {/* Logo */}
            <Image
              source={require("../assets/logo_ColisPerforma.png")}
              style={styles.logo}
              resizeMode="contain"
              onLoad={() => log("Logo loaded")}
              onError={(e) => log("Logo load error", e?.nativeEvent)}
            />

            <Text style={styles.title}>Connexion</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                if (__DEV__) log("Username changed", t);
              }}
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
              onChangeText={(t) => {
                setPassword(t);
                if (__DEV__) log("Password changed (len)", t?.length ?? 0);
              }}
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

            <TouchableOpacity onPress={() => { log("Navigate -> Signup"); navigation.navigate("Signup"); }}>
              <Text style={styles.link}>Créer un compte</Text>
            </TouchableOpacity>

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
