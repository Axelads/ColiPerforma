// screens/tabs/HeuresTab.js
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app/";

const PAUSE_OBLIGATOIRE_MIN = 21; // minutes de pause par jour travaillé

const toBool = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return !!v;
};

function monthLabel(d = new Date()) {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function getMonthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function isSundayISO(dateIso) {
  const d = new Date(dateIso);
  return d.getDay() === 0; // 0 = dimanche
}

// durée travaillée en minutes (avec passage minuit si besoin)
function workMinutes(heureDebutIso, heureFinIso) {
  if (!heureDebutIso || !heureFinIso) return 0;
  const start = new Date(heureDebutIso);
  const end = new Date(heureFinIso);
  let ms = end.getTime() - start.getTime();
  if (ms < 0) ms += 24 * 60 * 60 * 1000; // gestion si fin après minuit
  return Math.max(0, Math.round(ms / 60000));
}

// format minutes → "XhYY"
function fmtHM(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default function HeuresTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    minTravail: 0,
    minSupp: 0,
    minTotal: 0,
    joursTravailles: 0,
    moyenneMinParJour: 0,
    pauseTotale: 0,
  });

  const fetchMonthHours = useCallback(async () => {
    try {
      setLoading(true);

      // session utilisateur
      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!token || !user?.id) {
        Alert.alert("Session requise", "Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      // récupérer toutes les journées du mois en cours
      const { startISO, endISO } = getMonthBounds(new Date());
      const filter = `user="${user.id}" && date >= "${startISO}" && date <= "${endISO}"`;

      let page = 1;
      let items = [];
      while (true) {
        const res = await axios.get(
          `${PB_URL}/api/collections/journees/records`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { perPage: 200, page, filter },
          }
        );
        const json = res.data || {};
        items = items.concat(json.items || []);
        if (!json.totalPages || json.page >= json.totalPages) break;
        page += 1;
      }

      // calculs
      let minTravail = 0;   // minutes travaillées (pause déduite)
      let minSupp = 0;      // minutes d'heures sup
      let joursTravailles = 0;

      for (const e of items) {
        const nonWorked = toBool(e.isRepos) || toBool(e.isFerie) || isSundayISO(e.date);
        if (nonWorked) continue;

        let mins = workMinutes(e.heureDebut, e.heureFin);

        if (mins > 0) {
          // déduction pause obligatoire
          mins = Math.max(0, mins - PAUSE_OBLIGATOIRE_MIN);
          joursTravailles += 1;
        }

        minTravail += mins;

        const hs = Number(e.heuresSupp || 0);
        minSupp += Math.max(0, Math.round(hs * 60));
      }

      // total = uniquement heures de travail (sans supp)
      const minTotal = minTravail;
      const moyenneMinParJour = joursTravailles > 0 ? Math.round(minTravail / joursTravailles) : 0;
      const pauseTotale = joursTravailles * PAUSE_OBLIGATOIRE_MIN;

      setStats({
        minTravail,
        minSupp,
        minTotal,
        joursTravailles,
        moyenneMinParJour,
        pauseTotale,
      });
    } catch (e) {
      console.error("HeuresTab error:", e);
      Alert.alert("Erreur", e?.response?.data?.message || e.message || "Impossible de charger les heures.");
      setStats({
        minTravail: 0,
        minSupp: 0,
        minTotal: 0,
        joursTravailles: 0,
        moyenneMinParJour: 0,
        pauseTotale: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMonthHours();
    }, [fetchMonthHours])
  );

  const hTravail = useMemo(() => fmtHM(stats.minTravail), [stats.minTravail]);
  const hSupp = useMemo(() => fmtHM(stats.minSupp), [stats.minSupp]);
  const hTotal = useMemo(() => fmtHM(stats.minTotal), [stats.minTotal]);
  const hMoy = useMemo(() => fmtHM(stats.moyenneMinParJour), [stats.moyenneMinParJour]);
  const hPause = useMemo(() => fmtHM(stats.pauseTotale), [stats.pauseTotale]);

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeTxt}>{monthLabel()}</Text>
      </View>

      <Text style={styles.h}>Heures — mois en cours</Text>

      {loading ? (
        <View style={[styles.card, { alignItems: "center" }]}>
          <ActivityIndicator />
          <Text style={{ color: "#c9d1e1", marginTop: 10 }}>Chargement…</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Row label="Heures travaillées (pause déduite)" value={hTravail} />
            <Row label="Heures supplémentaires" value={hSupp} />
            <Row label="Total (hors supp.)" value={hTotal} />
            <Row label="Pause obligatoire totale" value={hPause} />
            <Row label="Jours travaillés" value={stats.joursTravailles} />
            <Row label="Moyenne / jour travaillé" value={hMoy} />
          </View>

          <Text style={styles.note}>
            Les <Text style={styles.bold}>dimanches</Text>, les jours marqués{" "}
            <Text style={styles.bold}>repos</Text> ou <Text style={styles.bold}>fériés</Text> sont exclus des cumuls.          
            Chaque jour travaillé déduit automatiquement{" "}
            <Text style={styles.bold}>{PAUSE_OBLIGATOIRE_MIN} minutes</Text> de pause obligatoire.
          </Text>
        </>
      )}
    </View>
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
  wrap: { paddingHorizontal: 12 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  badgeTxt: { color: "#c9d1e1", fontSize: 12, fontWeight: "700" },
  h: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  card: {
    backgroundColor: "#121722",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  lbl: { color: "#c9d1e1", fontSize: 14 },
  val: { color: "#fff", fontSize: 15, fontWeight: "700" },
  note: { color: "#9aa5b1", fontSize: 12, marginTop: 10 },
  bold: { color: "#e6e9ef", fontWeight: "800" },
});
