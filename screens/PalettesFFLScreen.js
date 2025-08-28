// screens/PalettesFFLScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DatePickerModal from "../components/DatePickerModal";
import PaletteRow from "../components/PaletteRow";
import PalettesTotalsBar from "../components/PalettesTotalsBar";
import axios from "axios";

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app/";
const NATO = ["Alfa","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliett","Kilo","Lima","Mike","November","Oscar","Papa","Quebec","Romeo","Sierra","Tango","Uniform","Victor","Whiskey","X-ray","Yankee","Zulu"];

function toKey(d) { return new Date(d).toISOString().slice(0,10); }

export default function PalettesFFLScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [items, setItems] = useState([]); // {id?, label, colis, _local?}
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const isToday = useMemo(() => toKey(date) === toKey(new Date()), [date]);
  const totalColis = useMemo(() => items.reduce((a, e) => a + (Number(e.colis)||0), 0), [items]);
  const totalPalettes = useMemo(() => items.length, [items]);

  // -------- bootstrap session & garde FFL
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("pb_token");
        const raw = await AsyncStorage.getItem("pb_model");
        const me = raw ? JSON.parse(raw) : null;
        if (!t || !me?.id) throw new Error("Session expirée. Reconnecte-toi.");

        // Garde FFL
        if (me?.secteur !== "FFL (Fruits, Légumes, Fleurs)") {
          Alert.alert("Accès limité", "Cette fonctionnalité est réservée au secteur FFL.");
          navigation.goBack?.();
          return;
        }

        setToken(t);
        setUser(me);
      } catch (e) {
        Alert.alert("Session", e.message || "Reconnecte-toi.");
        navigation.replace?.("Login");
      }
    })();
  }, [navigation]);

  // -------- charger les palettes du jour sélectionné
  const loadPalettes = useCallback(async () => {
    if (!user?.id || !token) return;
    try {
      setLoading(true);
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date);   end.setHours(23,59,59,999);
      const filter = `user="${user.id}" && date >= "${start.toISOString()}" && date <= "${end.toISOString()}"`;

      const res = await axios.get(`${PB_URL}/api/collections/palettes/records`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { perPage: 200, page: 1, filter, sort: "created" },
      });

      const list = (res.data?.items || []).map((r) => ({
        id: r.id,
        label: r.label || "",
        colis: Number(r.colis || 0),
      }));
      setItems(list);
    } catch (e) {
      Alert.alert("Erreur", e?.response?.data?.message || e.message || "Impossible de charger les palettes.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token, date]);

  useEffect(() => { loadPalettes(); }, [loadPalettes]);

  // -------- sync vers journees (create/patch le record du jour avec le total colis)
  const syncJourneeTotal = useCallback(async (forcedTotalColis) => {
    if (!user?.id || !token) return;
    try {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date);   end.setHours(23,59,59,999);
      const filter = `user="${user.id}" && date >= "${start.toISOString()}" && date <= "${end.toISOString()}"`;

      // 1) existe déjà ?
      const resGet = await axios.get(`${PB_URL}/api/collections/journees/records`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { perPage: 1, page: 1, filter },
      });

      const journee = resGet.data?.items?.[0] || null;
      const colisSum = typeof forcedTotalColis === "number" ? forcedTotalColis : items.reduce((a, e) => a + (Number(e.colis)||0), 0);
      const payload = {
        user: user.id,
        date: new Date(date).toISOString(),
        colis: Math.max(0, Number(colisSum || 0)),
      };

      if (journee?.id) {
        // PATCH uniquement le champ colis (on ne touche pas aux autres champs)
        await axios.patch(
          `${PB_URL}/api/collections/journees/records/${journee.id}`,
          payload,
          { headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` } }
        );
      } else {
        // CREATE minimal
        await axios.post(
          `${PB_URL}/api/collections/journees/records`,
          payload,
          { headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` } }
        );
      }
    } catch (e) {
      // on log doux, pas d'alert bloquante pour ne pas casser le flux
      console.log("syncJourneeTotal error:", e?.response?.data || e.message);
    }
  }, [user?.id, token, date, items]);

  // -------- actions CRUD
  const addPalette = () => {
    const nextIndex = items.length % NATO.length;
    const defaultLabel = NATO[nextIndex];
    setItems((prev) => [...prev, { _local: true, label: defaultLabel, colis: 0 }]);
  };

  const updateLocal = (index, patch) => {
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
  };

  const saveRow = async (index) => {
    if (!user?.id || !token) return;
    const row = items[index];
    const payload = {
      user: user.id,
      date: new Date(date).toISOString(),
      label: row.label || "",
      colis: Math.max(0, Number(row.colis||0)),
    };

    try {
      if (row.id) {
        // update
        const res = await axios.patch(
          `${PB_URL}/api/collections/palettes/records/${row.id}`,
          payload,
          { headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` } }
        );
        const saved = res.data;
        updateLocal(index, { id: saved.id, _local: false, label: saved.label, colis: Number(saved.colis||0) });
      } else {
        // create
        const res = await axios.post(
          `${PB_URL}/api/collections/palettes/records`,
          payload,
          { headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` } }
        );
        const saved = res.data;
        updateLocal(index, { id: saved.id, _local: false });
      }

      // 🔁 sync le total dans "journees"
      await syncJourneeTotal();
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Échec de l’enregistrement.";
      Alert.alert("Erreur", msg);
    }
  };

  const deleteRow = async (index) => {
    const row = items[index];
    try {
      if (row.id && token) {
        await axios.delete(
          `${PB_URL}/api/collections/palettes/records/${row.id}`,
          { headers: { Authorization:`Bearer ${token}` } }
        );
      }
      const next = items.filter((_, i) => i !== index);
      setItems(next);
      // 🔁 sync le nouveau total dans "journees"
      const newTotal = next.reduce((a, e) => a + (Number(e.colis)||0), 0);
      await syncJourneeTotal(newTotal);
    } catch (e) {
      Alert.alert("Erreur", e?.response?.data?.message || e.message || "Suppression impossible.");
    }
  };

  const changeDate = async (d) => {
    setDate(d);
    setPickerOpen(false);
    // rechargement des palettes de cette date
    // loadPalettes est déjà rappelé par useEffect via dépendances
  };

  // -------- UI
  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnGhost} onPress={() => setPickerOpen(true)}>
          <Text style={styles.btnGhostTxt}>
            {new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={addPalette}>
          <Text style={styles.btnTxt}>+ Palette</Text>
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={pickerOpen}
        initialDate={date}
        onConfirm={changeDate}
        onClose={() => setPickerOpen(false)}
        title="Choisir une date"
      />

      <View style={styles.card}>
        {loading ? (
          <Text style={{ color: "#c9d1e1" }}>Chargement…</Text>
        ) : items.length === 0 ? (
          <Text style={{ color: "#9aa5b1" }}>Aucune palette pour cette date. Ajoute-en une ✚</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, idx) => item.id ?? `local-${idx}`}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item, index }) => (
              <PaletteRow
                label={item.label}
                colis={item.colis}
                onChangeLabel={(v) => updateLocal(index, { label: v })}
                onChangeColis={(v) => updateLocal(index, { colis: v })}
                onSave={() => saveRow(index)}
                onDelete={() => deleteRow(index)}
                savingHint={item._local}
              />
            )}
          />
        )}
      </View>

      <PalettesTotalsBar
        totalColis={totalColis}
        totalPalettes={totalPalettes}
        isToday={isToday}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1115", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  header: { flexDirection: "row", gap: 8, marginBottom: 8 },
  btn: { backgroundColor: "#22c55e", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  btnTxt: { color: "#0f1115", fontWeight: "700", fontSize: 14 },
  btnGhost: { flex: 1, backgroundColor: "#121722", borderWidth: 1, borderColor: "#222938", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  btnGhostTxt: { color: "#e6e9ef", fontSize: 15, fontWeight: "600" },
  card: { flex: 1, backgroundColor: "#121722", borderWidth: 1, borderColor: "#222938", borderRadius: 14, padding: 12 },
});
