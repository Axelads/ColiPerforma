// screens/tabs/CalendrierTab.js
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// ---- Locale FR ----
LocaleConfig.locales.fr = {
  monthNames: ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"],
  monthNamesShort: ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."],
  dayNames: ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
  dayNamesShort: ["D","L","M","M","J","V","S"],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";

// ---- Constantes ----
const PB_URL = "http://192.168.1.25:8090";
const PAUSE_OBLIGATOIRE_MIN = 21;

// ---- Helpers ----
function toKey(d) {
  if (typeof d === "string") return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}
function isSundayKey(key) {
  const d = new Date(key);
  return d.getDay() === 0; // 0 = dimanche
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function monthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}
function workMinutes(heureDebutIso, heureFinIso) {
  if (!heureDebutIso || !heureFinIso) return 0;
  const start = new Date(heureDebutIso);
  const end = new Date(heureFinIso);
  let ms = end.getTime() - start.getTime();
  if (ms < 0) ms += 24 * 60 * 60 * 1000; // passage minuit
  return Math.max(0, Math.round(ms / 60000));
}
function fmtHM(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${pad2(m)}`;
}

export default function CalendrierTab() {
  const [items, setItems] = useState([]); // records PocketBase du mois
  const [selected, setSelected] = useState(toKey(new Date()));
  const [loading, setLoading] = useState(true);

  // ----- Chargement des journées du mois depuis PocketBase -----
  const loadMonth = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!token || !user?.id) {
        Alert.alert("Session requise", "Veuillez vous reconnecter.");
        setItems([]);
        return;
      }

      const { startISO, endISO } = monthBounds(new Date());
      const filter = encodeURIComponent(
        `user="${user.id}" && date >= "${startISO}" && date <= "${endISO}"`
      );

      let page = 1;
      let acc = [];
      while (true) {
        const res = await fetch(
          `${PB_URL}/api/collections/journees/records?perPage=200&page=${page}&filter=${filter}&sort=date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Chargement impossible.");
        acc = acc.concat(json.items || []);
        if (json.page >= json.totalPages) break;
        page += 1;
      }
      setItems(acc);
    } catch (e) {
      console.error("CalendrierTab loadMonth error:", e);
      Alert.alert("Erreur", e.message || "Impossible de charger le calendrier.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMonth();
    }, [loadMonth])
  );

  // ---- Trouver l’entrée du jour sélectionné (ou défaut) ----
  const current = useMemo(() => {
    const found = items.find((e) => toKey(e.date) === selected);
    const dim = isSundayKey(selected);

    if (!found) {
      return {
        id: null,
        date: selected,
        colis: 0,
        heuresSupp: 0,
        heureDebut: null,
        heureFin: null,
        poste: null,
        isRepos: false,
        isFerie: false,
        dimanche: dim,
      };
    }
    return {
      id: found.id,
      date: found.date,
      colis: Number(found.colis || 0),
      heuresSupp: Number(found.heuresSupp || 0),
      heureDebut: found.heureDebut || null,
      heureFin: found.heureFin || null,
      poste: found.poste || null,
      isRepos: !!found.isRepos,
      isFerie: !!found.isFerie,
      dimanche: dim,
    };
  }, [items, selected]);

  const nonWorked = current.dimanche || current.isRepos || current.isFerie;

  const workedLabel = useMemo(() => {
    if (nonWorked) return "0h00";
    let mins = workMinutes(current.heureDebut, current.heureFin);
    if (mins > 0) mins = Math.max(0, mins - PAUSE_OBLIGATOIRE_MIN);
    return fmtHM(mins);
  }, [current.heureDebut, current.heureFin, nonWorked]);

  // ---- Marquage du calendrier ----
  const markedDates = useMemo(() => {
    const marks = {};
    // marquer chaque record du mois
    items.forEach((e) => {
      const key = toKey(e.date);
      const nw = !!e.isRepos || !!e.isFerie || isSundayKey(key);
      marks[key] = {
        customStyles: {
          container: { backgroundColor: "transparent" },
          text: { color: nw ? "#6b7280" : "#e6e9ef", fontWeight: e.colis ? "700" : "400" },
        },
      };
    });
    // sélection
    marks[selected] = {
      selected: true,
      selectedColor: "#2563eb",
      selectedTextColor: "#ffffff",
    };
    return marks;
  }, [items, selected]);

  // ---- Création / update PocketBase pour les switches ----
  const updateFlags = async (next) => {
    try {
      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!token || !user?.id) {
        Alert.alert("Session requise", "Veuillez vous reconnecter.");
        return;
      }

      const keyISO = new Date(selected).toISOString();
      const payload = {
        user: user.id,
        date: keyISO,
        // si non travaillé → reset colis/HS/horaires
        colis: next.nonWorked ? 0 : current.colis || 0,
        heuresSupp: next.nonWorked ? 0 : current.heuresSupp || 0,
        heureDebut: next.nonWorked ? null : current.heureDebut,
        heureFin: next.nonWorked ? null : current.heureFin,
        poste: next.nonWorked ? null : (current.poste || null),
        isRepos: next.isRepos,
        isFerie: next.isFerie,
      };

      let res, json;
      if (current.id) {
        // update
        res = await fetch(`${PB_URL}/api/collections/journees/records/${current.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Mise à jour impossible.");
      } else {
        // create
        res = await fetch(`${PB_URL}/api/collections/journees/records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Création impossible.");
      }

      await loadMonth(); // refresh
    } catch (e) {
      console.error("CalendrierTab updateFlags error:", e);
      Alert.alert("Erreur", e.message || "Impossible de mettre à jour la journée.");
    }
  };

  const onToggleRepos = (value) => {
    const nextNonWorked = value || current.isFerie || current.dimanche;
    updateFlags({ isRepos: value, isFerie: current.isFerie, nonWorked: nextNonWorked });
  };
  const onToggleFerie = (value) => {
    const nextNonWorked = value || current.isRepos || current.dimanche;
    updateFlags({ isRepos: current.isRepos, isFerie: value, nonWorked: nextNonWorked });
  };

  // ---- Thème calendrier sombre ----
  const calTheme = {
    backgroundColor: "#0f1115",
    calendarBackground: "#0f1115",
    textSectionTitleColor: "#9aa5b1",
    monthTextColor: "#ffffff",
    textMonthFontWeight: "700",
    todayTextColor: "#60a5fa",
    arrowColor: "#e6e9ef",
    dayTextColor: "#e6e9ef",
    textDisabledColor: "#6b7280",
    selectedDayBackgroundColor: "#2563eb",
    selectedDayTextColor: "#ffffff",
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Calendar
        onDayPress={(d) => setSelected(d.dateString)}
        markedDates={markedDates}
        markingType="custom"
        theme={calTheme}
        enableSwipeMonths
        firstDay={1}
      />

      {/* Card récap */}
      <View style={styles.card}>
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <ActivityIndicator />
            <Text style={{ color: "#c9d1e1", marginTop: 8 }}>Chargement…</Text>
          </View>
        ) : (
          <>
            <Row
              label="Nombre de colis total"
              value={nonWorked ? 0 : (current.colis || 0)}
            />
            <Row
              label="Heures travaillées (pause déduite)"
              value={nonWorked ? "0h00" : workedLabel}
            />
            <Row
              label="Poste occupé"
              value={nonWorked ? "-" : (current.poste || "-")}
            />

            <View style={[styles.switchRow, { marginTop: 10 }]}>
              <Text style={styles.lbl}>Jour de repos</Text>
              <Switch
                value={!!current.isRepos}
                onValueChange={onToggleRepos}
                thumbColor={current.isRepos ? "#22c55e" : "#9aa5b1"}
              />
            </View>

            {current.dimanche ? (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>Dimanche — non travaillé</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.btn}
              onPress={() =>
                Alert.alert(
                  "Astuce",
                  "Pour modifier les horaires/colis, passe sur l’onglet “Journée”."
                )
              }
            >
              <Text style={styles.btnTxt}>Modifier cette journée</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.lbl}>{label}</Text>
      <Text style={styles.val}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1115" },
  card: {
    backgroundColor: "#121722",
    borderWidth: 1, borderColor: "#222938",
    borderRadius: 18,
    padding: 14,
    margin: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  lbl: { color: "#c9d1e1", fontSize: 14, fontWeight: "600" },
  val: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  badgeTxt: { color: "#c9d1e1", fontSize: 12, fontWeight: "700" },
  btn: {
    backgroundColor: "#1a1f29",
    borderWidth: 1, borderColor: "#2a3344",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  btnTxt: { color: "#e6e9ef", fontWeight: "700" },
});
