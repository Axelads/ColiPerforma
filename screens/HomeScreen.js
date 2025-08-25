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

export default function HomeScreen({ navigation }) {
  const [activeKey, setActiveKey] = useState("journee"); // par défaut: Journée
  const [me, setMe] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const raw = await AsyncStorage.getItem("pb_model");
        if (raw) setMe(JSON.parse(raw));
      } catch (e) {
        console.log("Erreur chargement user:", e);
      }
    };
    loadMe();
  }, []);

  const renderContent = () => {
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

  return (
    <SafeAreaView style={styles.page}>
      <TopBar onLeftPress={() => navigation.navigate("Parametres")} />

      {/* Bouton visible uniquement pour le secteur FFL */}
      {me?.secteur === "FFL (Fruits, Légumes, Fleurs)" && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate("PalettesFFL")}
        >
          <Text style={styles.btnTxt}>Saisir palettes FFL</Text>
        </TouchableOpacity>
      )}

      <SegmentTabs
        tabs={TABS}
        activeKey={activeKey}
        onChange={setActiveKey}
      />
      <LogoutButton navigation={navigation} />

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
