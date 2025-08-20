// screens/CitySearchScreen.js
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import Constants from "expo-constants";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

const API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_PLACES_KEY ??
  Constants.manifest?.extra?.GOOGLE_PLACES_KEY ??
  null;

export default function CitySearchScreen({ navigation, route }) {
  const { onPick, country = "fr", initialValue = "" } = route.params || {};

  if (!API_KEY) {
    Alert.alert(
      "Clé Google manquante",
      "Ajoute ta clé dans app.json → expo.extra.GOOGLE_PLACES_KEY puis relance avec `npx expo start -c`."
    );
  }

  const stylesGPA = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: "#0f1115" },
      textInputContainer: {
        backgroundColor: "#0f1115",
        paddingHorizontal: 12,
        paddingTop: 16,
      },
      textInput: {
        height: 48,
        backgroundColor: "#1a1f29",
        borderWidth: 1,
        borderColor: "#222938",
        borderRadius: 12,
        color: "#e6e9ef",
        fontSize: 16,
        paddingHorizontal: 12,
      },
      listView: {
        backgroundColor: "#0f1115",
        borderTopWidth: 1,
        borderColor: "#222938",
      },
      row: {
        backgroundColor: "#0f1115",
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      separator: { height: 1, backgroundColor: "#1c2331" },
      description: { color: "#e6e9ef" },
      poweredContainer: { display: "none" },
    }),
    []
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Choisir une ville</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      <GooglePlacesAutocomplete
        placeholder="Tapez le nom de la ville"
        query={{
          key: API_KEY || "invalid",
          language: "fr",
          components: `country:${country}`,
          types: "(cities)",
        }}
        requestConfig={{ timeout: 10000 }}
        onPress={(data /* , details */) => {
          onPick && onPick(data?.description ?? "");
          navigation.goBack();
        }}
        textInputProps={{ defaultValue: initialValue }}
        minLength={2}
        fetchDetails={false}
        enablePoweredByContainer={false}
        keepResultsAfterBlur
        debounce={200}
        styles={stylesGPA}
        onFail={(e) => console.warn("Places onFail:", e)}
        onNotFound={() => console.warn("Places: not found")}
        predefinedPlaces={[]}
        predefinedPlacesAlwaysVisible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1115" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "700" },
  closeBtn: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  closeTxt: { color: "#e5e7eb", fontWeight: "700" },
});
