// screens/tabs/ColisTab.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app";
const QUOTA = { CDD: 1190, CDI: 1260 };

function monthLabel(d = new Date()) {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function getMonthBounds(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export default function ColisTab() {
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState("CDI"); // défaut
  const [stats, setStats] = useState({
    totalColis: 0,
    totalAuQuota: 0,
    totalPrimes: 0,
    nbJoursQuotaAtteint: 0,
  });

  const quota = useMemo(() => QUOTA[contract] ?? QUOTA.CDI, [contract]);

  const fetchUserAndStats = useCallback(async () => {
    try {
      setLoading(true);

      // Récup session
      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!token || !user?.id) {
        Alert.alert("Session requise", "Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      // 1) Contrat utilisateur (depuis le cache ou via GET user)
      let userContract = user.contrat;
      if (!userContract) {
        try {
          const resUser = await axios.get(
            `${PB_URL}/api/collections/users/records/${user.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          userContract = resUser.data?.contrat || "CDI";
        } catch {
          userContract = "CDI";
        }
      }
      setContract(userContract);

      // 2) Récup des journées du mois en cours (pagination simple)
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
        const json = res.data;
        items = items.concat(json.items || []);
        if (json.page >= json.totalPages) break;
        page += 1;
      }

      // 3) Calculs
      let totalColis = 0;
      let totalAuQuota = 0;
      let totalPrimes = 0;
      let nbJoursQuotaAtteint = 0;

      for (const e of items) {
        const colis = Number(e.colis || 0);
        const nonWorked = !!e.isRepos || !!e.isFerie || isSundayISO(e.date);
        // on compte dans le total mensuel même si nonWorked
        totalColis += colis;

        if (!nonWorked) {
          // quota journalier en fonction du contrat
          const q = QUOTA[userContract] ?? QUOTA.CDI;
          totalAuQuota += Math.min(colis, q);
          totalPrimes += Math.max(0, colis - q);
          if (colis >= q) nbJoursQuotaAtteint += 1;
        }
      }

      setStats({ totalColis, totalAuQuota, totalPrimes, nbJoursQuotaAtteint });
    } catch (e) {
      console.error("ColisTab error:", e);
      Alert.alert("Erreur", e?.response?.data?.message || e.message || "Impossible de charger les statistiques.");
      setStats({ totalColis: 0, totalAuQuota: 0, totalPrimes: 0, nbJoursQuotaAtteint: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // recharge à chaque focus sur l’onglet
  useFocusEffect(
    useCallback(() => {
      fetchUserAndStats();
    }, [fetchUserAndStats])
  );

  // Si jamais tu veux recharger quand le contrat change
  useEffect(() => {}, [contract]);

  return (
    <View style={styles.wrap}>
      {/* Bulle mois en cours */}
      <View style={styles.badge}>
        <Text style={styles.badgeTxt}>{monthLabel()}</Text>
      </View>

      <Text style={styles.h}>Colis — mois en cours</Text>

      {loading ? (
        <View style={[styles.card, { alignItems: "center" }]}>
          <ActivityIndicator />
          <Text style={{ color: "#c9d1e1", marginTop: 10 }}>Chargement…</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Row label="Nombre de Colis Total" value={stats.totalColis} />
            <Row label="Nombre de Colis au Quotas" value={stats.totalAuQuota} />
            <Row label="Nombre de Colis primés" value={stats.totalPrimes} />
            <Row
              label="Nombre de fois où le Quotas a été atteint"
              value={stats.nbJoursQuotaAtteint}
            />
          </View>

          <Text style={styles.note}>
            Contrat : {contract} — Quota journalier = {quota} colis.
          </Text>
          <Text style={styles.subnote}>
            * Les jours marqués repos/férié et les dimanches ne comptent pas pour “quota atteint”.
          </Text>
        </>
      )}
    </View>
  );
}

// utils
function isSundayISO(dateIso) {
  const d = new Date(dateIso);
  return d.getDay() === 0; // 0 = dimanche
}

// UI
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
  subnote: { color: "#667085", fontSize: 11, marginTop: 4 },
});
