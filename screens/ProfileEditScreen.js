import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import SelectField from "../components/SelectField";
import DatePickerModal from "../components/DatePickerModal";
import DateTimePicker from "@react-native-community/datetimepicker";

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" }) : "-";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-";

export default function ProfileEditScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [secteur, setSecteur] = useState(null);       // SEC | FFL (Fruits, Légumes, Fleurs) | MECA | AUTRE
  const [ville, setVille] = useState("");
  const [contrat, setContrat] = useState("CDI");      // CDI | CDD

  const [dateDebut, setDateDebut] = useState(null);
  const [dateFin, setDateFin] = useState(null);
  const [showDebut, setShowDebut] = useState(false);
  const [showFin, setShowFin] = useState(false);

  const [heureDebut, setHeureDebut] = useState(null);
  const [heureFin, setHeureFin] = useState(null);
  const [showHStart, setShowHStart] = useState(false);
  const [showHEnd, setShowHEnd] = useState(false);

  const canShowCDD = contrat === "CDD";

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("pb_token");
        const raw = await AsyncStorage.getItem("pb_model");
        const me = raw ? JSON.parse(raw) : null;
        if (!token || !me?.id) {
          Alert.alert("Session", "Session expirée. Reconnecte-toi.");
          navigation.replace("Login");
          return;
        }
        const res = await fetch(`${PB_URL}/api/collections/users/records/${me.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Impossible de charger le profil.");

        setNom(data.nom || "");
        setPrenom(data.prenom || "");
        setEmail(data.email || "");
        setEntreprise(data.entreprise || "");
        setSecteur(data.secteur ?? null);
        setVille(data.ville || "");
        setContrat(data.contrat || "CDI");
        setDateDebut(data.dateDebut ? new Date(data.dateDebut) : null);
        setDateFin(data.dateFin ? new Date(data.dateFin) : null);
        setHeureDebut(data.heureDebut ? new Date(data.heureDebut) : null);
        setHeureFin(data.heureFin ? new Date(data.heureFin) : null);
      } catch (e) {
        Alert.alert("Erreur", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigation]);

  const save = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("pb_token");
      const raw = await AsyncStorage.getItem("pb_model");
      const me = raw ? JSON.parse(raw) : null;
      if (!token || !me?.id) throw new Error("Session expirée. Reconnecte-toi.");

      const body = {
        email,
        entreprise,
        secteur,
        ville,
        contrat,
        dateDebut: canShowCDD && dateDebut ? new Date(dateDebut).toISOString() : null,
        dateFin:   canShowCDD && dateFin   ? new Date(dateFin).toISOString()   : null,
        heureDebut: heureDebut ? new Date(heureDebut).toISOString() : null,
        heureFin:   heureFin   ? new Date(heureFin).toISOString()   : null,
      };

      const res = await fetch(`${PB_URL}/api/collections/users/records/${me.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.data
          ? Object.entries(json.data).map(([k, v]) => `${k}: ${v?.message}`).join("\n")
          : (json?.message || "Échec de la sauvegarde.");
        throw new Error(msg);
      }

      const newModel = { ...(JSON.parse(await AsyncStorage.getItem("pb_model")) || {}), ...json };
      await AsyncStorage.setItem("pb_model", JSON.stringify(newModel));

      Alert.alert("✅ Sauvegardé", "Profil mis à jour.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackButton navigation={navigation} />
        <Text style={[styles.titre, { textAlign: "center" }]}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackButton navigation={navigation} />
        <Text style={styles.titre}>Modifier mon profil</Text>

        <Text style={styles.label}>Nom</Text>
        <TextInput style={[styles.input, styles.readonly]} value={nom} editable={false} />

        <Text style={styles.label}>Prénom</Text>
        <TextInput style={[styles.input, styles.readonly]} value={prenom} editable={false} />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="exemple@domaine.com"
          placeholderTextColor="#8c9199"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Entreprise</Text>
        <TextInput
          style={styles.input}
          value={entreprise}
          onChangeText={setEntreprise}
          placeholder="Nom de l'entreprise"
          placeholderTextColor="#8c9199"
        />

        <Text style={styles.label}>Localisation (ville)</Text>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() =>
            navigation.navigate("CitySearch", {
              initialValue: ville, country: "fr", onPick: (val) => setVille(val),
            })
          }
        >
          <Text style={styles.btnGhostTxt}>{ville || "Rechercher une ville…"}</Text>
        </TouchableOpacity>

        <SelectField
          label="Secteur d’activité"
          value={secteur}
          onChange={setSecteur}
          options={[
            { label: "SEC", value: "SEC" },
            { label: "FFL (Fruits, Légumes, Fleurs)", value: "FFL (Fruits, Légumes, Fleurs)" },
            { label: "Méca", value: "MECA" },
            { label: "Autre", value: "AUTRE" },
          ]}
        />

        <SelectField
          label="Nature du contrat"
          value={contrat}
          onChange={setContrat}
          options={[{ label: "CDI", value: "CDI" }, { label: "CDD", value: "CDD" }]}
        />

        {canShowCDD && (
          <View style={{ gap: 10 }}>
            <Text style={styles.subLabel}>Dates du contrat (CDD)</Text>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.subLabel}>Début</Text>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setShowDebut(true)}>
                  <Text style={styles.btnGhostTxt}>{fmtDate(dateDebut)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.subLabel}>Fin</Text>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setShowFin(true)}>
                  <Text style={styles.btnGhostTxt}>{fmtDate(dateFin)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <DatePickerModal
              visible={showDebut}
              initialDate={dateDebut || new Date()}
              onConfirm={(d) => { setDateDebut(d); if (dateFin && d > dateFin) setDateFin(d); }}
              onClose={() => setShowDebut(false)}
              title="Début du contrat"
              maxDate={dateFin || undefined}
            />
            <DatePickerModal
              visible={showFin}
              initialDate={dateFin || (dateDebut || new Date())}
              onConfirm={setDateFin}
              onClose={() => setShowFin(false)}
              title="Fin du contrat"
              minDate={dateDebut || undefined}
            />
          </View>
        )}

        <Text style={[styles.label, { marginTop: 10 }]}>Plage horaire par défaut</Text>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.subLabel}>Heure d’entrée</Text>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setShowHStart(true)}>
              <Text style={styles.btnGhostTxt}>{fmtTime(heureDebut)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.subLabel}>Heure de fin</Text>
            <TouchableOpacity style={styles.btnGhost} onPress={() => setShowHEnd(true)}>
              <Text style={styles.btnGhostTxt}>{fmtTime(heureFin)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showHStart && (
          <View style={styles.pickerInline}>
            <DateTimePicker
              value={heureDebut || new Date(2000, 0, 1, 10, 0, 0)}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, t) => { if (Platform.OS !== "ios") setShowHStart(false); if (t) setHeureDebut(t); }}
              themeVariant="dark"
            />
            <TouchableOpacity style={styles.btnClose} onPress={() => setShowHStart(false)}>
              <Text style={styles.btnCloseTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        )}
        {showHEnd && (
          <View style={styles.pickerInline}>
            <DateTimePicker
              value={heureFin || new Date(2000, 0, 1, 17, 21, 0)}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, t) => { if (Platform.OS !== "ios") setShowHEnd(false); if (t) setHeureFin(t); }}
              themeVariant="dark"
            />
            <TouchableOpacity style={styles.btnClose} onPress={() => setShowHEnd(false)}>
              <Text style={styles.btnCloseTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, { marginTop: 16, opacity: saving ? 0.6 : 1 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.btnTxt}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1115" },
  container: { padding: 20, paddingBottom: 40 },
  titre: { fontSize: 22, fontWeight: "700", color: "#ffffff", textAlign: "center", marginTop: 8, marginBottom: 16 },
  label: { color: "#c9d1e1", fontSize: 14, marginBottom: 6, marginTop: 6 },
  subLabel: { color: "#9aa5b1", fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: "#1a1f29", borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16,
    color: "#e6e9ef", marginBottom: 12,
  },
  readonly: { opacity: 0.7 },
  row: { flexDirection: "row", gap: 12, marginBottom: 8 },
  rowItem: { flex: 1 },
  btnGhost: {
    backgroundColor: "#121722", borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center",
  },
  btnGhostTxt: { color: "#e6e9ef", fontSize: 15, fontWeight: "600" },
  pickerInline: {
    backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, padding: 10, marginTop: 6, marginBottom: 6,
  },
  btnClose: {
    marginTop: 8, alignSelf: "flex-end", backgroundColor: "#374151", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  btnCloseTxt: { color: "#e5e7eb", fontWeight: "600" },
  btn: {
    backgroundColor: "#22c55e", borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 16, alignItems: "center",
  },
  btnTxt: { color: "#0f1115", fontWeight: "700", fontSize: 16 },
});
