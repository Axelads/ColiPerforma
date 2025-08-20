// screens/SignupScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert, 
  ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerModal from "../components/DatePickerModal";
import SelectField from "../components/SelectField";
import axios from "axios";

export default function SignupScreen({ navigation }) {
  // Identité
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [loading, setLoading] = useState(false);

  // Entreprise & secteur & ville
  const [entreprise, setEntreprise] = useState("");
  const [secteur, setSecteur] = useState(null);
  const [ville, setVille] = useState("");

  // option pour le secteur d'activité
  const SECTEUR_OPTIONS = [
    { label: "SEC", value: "SEC" },
    { label: "FFL (Fruits, Légumes, Fleurs)", value: "FFL (Fruits, Légumes, Fleurs)" },
    { label: "Méca", value: "Méca" },
    { label: "Gel", value: "Gel" },
    { label: "Autre...", value: "Autre..." },
  ];

  // Contrat
  const [contrat, setContrat] = useState("CDI");
  const [dateDebut, setDateDebut] = useState(new Date());
  const [dateFin, setDateFin] = useState(new Date());
  const [showDebutPicker, setShowDebutPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);

  // Horaires journaliers
  const [heureDebut, setHeureDebut] = useState(new Date(2000, 0, 1, 10, 0, 0));
  const [heureFin, setHeureFin] = useState(new Date(2000, 0, 1, 17, 21, 0));
  const [showHeureDebut, setShowHeureDebut] = useState(false);
  const [showHeureFin, setShowHeureFin] = useState(false);

  // Helpers
  const fmtDate = (d) =>
    d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const fmtTime = (d) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Handlers Heures
  const onChangeHeureDebut = (_, selectedTime) => {
    if (Platform.OS !== "ios") setShowHeureDebut(false);
    if (selectedTime) setHeureDebut(selectedTime);
  };
  const onChangeHeureFin = (_, selectedTime) => {
    if (Platform.OS !== "ios") setShowHeureFin(false);
    if (selectedTime) setHeureFin(selectedTime);
  };

  // 🔥 Fonction d'inscription avec PocketBase
  const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app"; // ⇦ ton IP locale

  const handleSignup = async () => {
    if (!email || !pass) {
      Alert.alert("Champs requis", "Email et mot de passe sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      // 1) Création du compte
      const payload = {
        email,
        password: pass,
        passwordConfirm: pass,
        nom,
        prenom,
        ville,
        entreprise,
        secteur,
        contrat,
        dateDebut: dateDebut.toISOString(),
        dateFin: contrat === "CDD" ? dateFin.toISOString() : null,
        heureDebut: heureDebut.toISOString(),
        heureFin: heureFin.toISOString(),
      };

      await axios.post(
        `${PB_URL}/api/collections/users/records`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      // 2) (Option) Login auto juste après la création
      await axios.post(
        `${PB_URL}/api/collections/users/auth-with-password`,
        { identity: email, password: pass },
        { headers: { "Content-Type": "application/json" } }
      );

      // 3) Succès + navigation
      Alert.alert("Compte créé ✅", "Bienvenue sur ColiPerforma !", [
        { text: "OK", onPress: () => navigation.replace("Home") },
      ]);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Impossible de créer le compte.";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Text style={styles.titre}>Créer un compte</Text>

      {/* Identité */}
      <TextInput
        style={styles.input}
        placeholder="Nom"
        placeholderTextColor="#8c9199"
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        style={styles.input}
        placeholder="Prénom"
        placeholderTextColor="#8c9199"
        value={prenom}
        onChangeText={setPrenom}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8c9199"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#8c9199"
        secureTextEntry
        value={pass}
        onChangeText={setPass}
      />

      {/* Entreprise */}
      <Text style={styles.label}>Entreprise</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom de l'entreprise"
        placeholderTextColor="#8c9199"
        value={entreprise}
        onChangeText={setEntreprise}
      />

      {/* Localisation */}
      <Text style={styles.label}>Localisation (ville)</Text>
      <TouchableOpacity
        style={styles.btnGhost}
        onPress={() =>
          navigation.navigate("CitySearch", {
            initialValue: ville,
            country: "fr",
            onPick: (val) => setVille(val),
          })
        }
      >
        <Text style={styles.btnGhostTxt}>{ville || "Rechercher une ville…"}</Text>
      </TouchableOpacity>

      {/* Select Secteur */}
      <SelectField
        label="Secteur d’activité"
        value={secteur}
        onChange={setSecteur}
        options={SECTEUR_OPTIONS}
      />

      {/* Select Contrat */}
      <SelectField
        label="Nature du contrat"
        value={contrat}
        onChange={setContrat}
        options={[
          { label: "CDI", value: "CDI" },
          { label: "CDD", value: "CDD" },
        ]}
      />

      {/* Dates CDD */}
      {contrat === "CDD" && (
        <View style={{ gap: 10 }}>
          <Text style={styles.label}>Dates du contrat (CDD)</Text>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.subLabel}>Début du contrat</Text>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => setShowDebutPicker(true)}
              >
                <Text style={styles.btnGhostTxt}>{fmtDate(dateDebut)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rowItem}>
              <Text style={styles.subLabel}>Fin du contrat</Text>
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => setShowFinPicker(true)}
              >
                <Text style={styles.btnGhostTxt}>{fmtDate(dateFin)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modales calendrier */}
      <DatePickerModal
        visible={showDebutPicker}
        initialDate={dateDebut}
        onConfirm={(d) => {
          setDateDebut(d);
          if (dateFin < d) setDateFin(d);
        }}
        onClose={() => setShowDebutPicker(false)}
        title="Début du contrat"
        maxDate={dateFin}
      />
      <DatePickerModal
        visible={showFinPicker}
        initialDate={dateFin}
        onConfirm={(d) => setDateFin(d)}
        onClose={() => setShowFinPicker(false)}
        title="Fin du contrat"
        minDate={dateDebut}
      />

      {/* Horaires */}
      <Text style={[styles.label, { marginTop: 10 }]}>Plage horaire</Text>
      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.subLabel}>Heure d’entrée</Text>
          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => setShowHeureDebut(true)}
          >
            <Text style={styles.btnGhostTxt}>{fmtTime(heureDebut)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.subLabel}>Heure de fin</Text>
          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => setShowHeureFin(true)}
          >
            <Text style={styles.btnGhostTxt}>{fmtTime(heureFin)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showHeureDebut && (
        <View style={styles.pickerInline}>
          <DateTimePicker
            value={heureDebut}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeHeureDebut}
          />
          <TouchableOpacity
            style={styles.btnClose}
            onPress={() => setShowHeureDebut(false)}
          >
            <Text style={styles.btnCloseTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}

      {showHeureFin && (
        <View style={styles.pickerInline}>
          <DateTimePicker
            value={heureFin}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeHeureFin}
          />
          <TouchableOpacity
            style={styles.btnClose}
            onPress={() => setShowHeureFin(false)}
          >
            <Text style={styles.btnCloseTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity 
        style={[styles.btn, { marginTop: 16 }]} 
        onPress={handleSignup} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0f1115" />
        ) : (
          <Text style={styles.btnTxt}>S’inscrire</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.lien}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// Styles (inchangés)
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0f1115" },
  pageContent: { padding: 24, paddingBottom: 40 },
  titre: { fontSize: 24, fontWeight: "700", color: "#ffffff", textAlign: "center", marginTop: 40, marginBottom: 16 },
  label: { color: "#c9d1e1", fontSize: 14, marginBottom: 6, marginTop: 6 },
  subLabel: { color: "#9aa5b1", fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: "#1a1f29", borderWidth: 1, borderColor: "#222938", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, color: "#e6e9ef", marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, marginTop: 2, marginBottom: 8 },
  rowItem: { flex: 1 },
  btnGhost: { backgroundColor: "#121722", borderWidth: 1, borderColor: "#222938", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  btnGhostTxt: { color: "#e6e9ef", fontSize: 15, fontWeight: "600" },
  pickerInline: { backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#222938", borderRadius: 10, padding: 10, marginTop: 6, marginBottom: 6 },
  btnClose: { marginTop: 8, alignSelf: "flex-end", backgroundColor: "#374151", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  btnCloseTxt: { color: "#e5e7eb", fontWeight: "600" },
  btn: { backgroundColor: "#22c55e", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", marginTop: 8 },
  btnTxt: { color: "#0f1115", fontWeight: "700", fontSize: 16 },
  lien: { color: "#8ab4ff", textAlign: "center", marginTop: 12, fontSize: 14, paddingBottom: 16 },
});
