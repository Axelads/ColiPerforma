// screens/CitySearchScreen.js
import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, TextInput, ActivityIndicator } from "react-native";
import axios from "axios";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
// (optionnel) une adresse email de contact pour respecter la policy Nominatim
const NOMINATIM_EMAIL = "contact@ton-domaine.fr"; // ou laisse vide

export default function CitySearchScreen({ navigation, route }) {
  const { onPick, country = "fr", initialValue = "" } = route.params || {};
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const fetchCities = async (text) => {
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(NOMINATIM_BASE, {
        params: {
          q: text,
          format: "jsonv2",
          "accept-language": "fr",
          countrycodes: country.toLowerCase(), // ex: "fr"
          limit: 10,
          email: NOMINATIM_EMAIL || undefined, // facultatif mais recommandé
          dedupe: 1,
        },
        headers: {
          // recommandé par Nominatim : identifier ton appli
          "User-Agent": "ColiPerforma/1.0 (+https://pocketbasecoliperforma.onrender.com)",
          Referer: "https://pocketbasecoliperforma.onrender.com",
        },
        timeout: 15000,
      });

      // On garde place.type intéressant (city, town, village)
      const all = Array.isArray(res.data) ? res.data : [];
      const filtered = all.filter(
        (p) =>
          ["city", "town", "village"].includes(p.type) ||
          (p.class === "place" && ["city", "town", "village"].includes(p.type))
      );
      setResults(filtered);
    } catch (err) {
      console.error("Nominatim error:", err);
      Alert.alert("Erreur", "Impossible de récupérer les villes.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeQuery = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(text), 350);
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
      rowSub: { color: "#9aa5b1", fontSize: 12, marginTop: 2 },
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
        onChangeText={onChangeQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.place_id)}
          style={stylesGPA.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={stylesGPA.row}
              onPress={() => {
                // on renvoie le libellé principal
                const label = item.display_name || item.name || "";
                onPick && onPick(label);
                navigation.goBack();
              }}
            >
              <Text style={stylesGPA.rowText}>{item.name || item.display_name}</Text>
              {item.display_name ? (
                <Text style={stylesGPA.rowSub}>{item.display_name}</Text>
              ) : null}
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
