// screens/HomeScreen.js
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// composants
import TopBar from "../components/TopBar";
import SegmentTabs from "../components/SegmentTabs";
import LogoutButton from "../components/LogoutButton";

// tabs
import JourneeTab from "../screens/tabs/JourneeTab";
import ColisTab from "../screens/tabs/ColisTab";
import HeuresTab from "../screens/tabs/HeuresTab";
import CalendrierTab from "../screens/tabs/CalendrierTab";

const TABS = [
  { key: "journee", label: "Journée" },
  { key: "colis", label: "Colis" },
  { key: "heures", label: "Heures" },
  { key: "calendrier", label: "Calendrier" },
];

const log = (...args) => console.log("[HomeScreen]", ...args);

export default function HomeScreen({ navigation }) {
  const [activeKey, setActiveKey] = useState("journee"); // par défaut: Journée
  const [me, setMe] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      log("Mount -> loadMe()");
      try {
        const raw = await AsyncStorage.getItem("pb_model");
        log("AsyncStorage pb_model raw length:", raw ? raw.length : 0);

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setMe(parsed);
            log("pb_model parsed", {
              id: parsed?.id,
              email: parsed?.email,
              secteur: parsed?.secteur,
              verified: parsed?.verified,
            });
          } catch (e) {
            log("JSON.parse pb_model FAILED -> clearing pb_model", e?.message);
            await AsyncStorage.removeItem("pb_model");
            setMe(null);
          }
        } else {
          log("No pb_model in storage");
          setMe(null);
        }
      } catch (e) {
        log("Erreur chargement user:", e?.message);
      }
    };
    loadMe();
  }, []);

  const renderContent = () => {
    log("renderContent", activeKey);
    switch (activeKey) {
      case "journee":
        return <JourneeTab />;
      case "colis":
        return <ColisTab />;
      case "heures":
        return <HeuresTab />;
      case "calendrier":
        return <CalendrierTab />;
      default:
        return <JourneeTab />;
    }
  };

  useEffect(() => {
    log("activeKey changed ->", activeKey);
  }, [activeKey]);

  const showFFLBtn = me?.secteur === "FFL (Fruits, Légumes, Fleurs)";
  if (me && "secteur" in me) {
    log("me.secteur:", me?.secteur, " -> showFFLBtn:", showFFLBtn);
  } else {
    log("me not loaded yet or secteur missing");
  }

  return (
    <SafeAreaView style={styles.page}>
      <TopBar
        onLeftPress={() => {
          log("Navigate -> Parametres");
          navigation.navigate("Parametres");
        }}
      />

      {/* Bouton visible uniquement pour le secteur FFL */}
      {showFFLBtn && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            log("Navigate -> PalettesFFL");
            navigation.navigate("PalettesFFL");
          }}
        >
          <Text style={styles.btnTxt}>Saisir palettes FFL</Text>
        </TouchableOpacity>
      )}

      <SegmentTabs
        tabs={TABS}
        activeKey={activeKey}
        onChange={(key) => {
          log("SegmentTabs onChange", key);
          setActiveKey(key);
        }}
      />
      <LogoutButton
        navigation={navigation}
        onPress={() => log("LogoutButton pressed")}
      />

      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#0f1115",
    padding: 20,
  },
  content: {
    flex: 1,
    paddingVertical: 8,
  },
  btn: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  btnTxt: {
    color: "#0f1115",
    fontWeight: "700",
    fontSize: 16,
  },
});
