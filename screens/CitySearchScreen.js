// screens/CitySearchScreen.js
import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, TextInput, ActivityIndicator } from "react-native";
import Constants from "expo-constants";
import axios from "axios";

const API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_PLACES_KEY ??
  Constants.manifest?.extra?.GOOGLE_PLACES_KEY ??
  null;

export default function CitySearchScreen({ navigation, route }) {
  const { onPick, country = "fr", initialValue = "" } = route.params || {};
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!API_KEY) {
    Alert.alert(
      "Clé Google manquante",
      "Ajoute ta clé dans app.json → expo.extra.GOOGLE_PLACES_KEY puis relance avec `npx expo start -c`."
    );
  }

  const fetchCities = async (text) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
        params: {
          input: text,
          key: API_KEY,
          language: "fr",
          components: `country:${country}`,
          types: "(cities)",
        },
        timeout: 15000,
      });

      const predictions = res.data?.predictions ?? [];
      setResults(predictions);
    } catch (err) {
      console.error("Axios Places error:", err);
      Alert.alert("Erreur", "Impossible de récupérer les villes.");
    } finally {
      setLoading(false);
    }
  };

  const stylesGPA = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: "#0f1115" },
      input: {
        height: 48,
        backgroundColor: "#1a1f29",
        borderWidth: 1,
        borderColor: "#222938",
        borderRadius: 12,
        color: "#e6e9ef",
        fontSize: 16,
        paddingHorizontal: 12,
        margin: 12,
      },
      list: { flex: 1, backgroundColor: "#0f1115" },
      row: {
        backgroundColor: "#0f1115",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: "#1c2331",
      },
      rowText: { color: "#e6e9ef" },
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

      <TextInput
        style={stylesGPA.input}
        placeholder="Tapez le nom de la ville"
        placeholderTextColor="#aaa"
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          fetchCities(text);
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          style={stylesGPA.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={stylesGPA.row}
              onPress={() => {
                onPick && onPick(item.description ?? "");
                navigation.goBack();
              }}
            >
              <Text style={stylesGPA.rowText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
