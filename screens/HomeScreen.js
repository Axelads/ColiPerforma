// screens/HomeScreen.js
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
});
