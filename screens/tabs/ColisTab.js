import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";

// ⚠️ normalise pour éviter //api
const PB_URL_RAW = "https://cooing-emalee-axelads-7ec4b898.koyeb.app/";
const PB_URL = PB_URL_RAW.replace(/\/+$/, "");
const log = (...args) => console.log("[ColisTab]", ...args);

const QUOTA = { CDD: 1190, CDI: 1260 };

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
  return d.getDay() === 0;
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

      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      log("session", { hasToken: !!token, userId: user?.id });

      if (!token || !user?.id) {
        Alert.alert("Session requise", "Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      // 1) Contrat utilisateur
      let userContract = user.contrat;
      if (!userContract) {
        try {
          const urlUser = `${PB_URL}/api/collections/users/records/${user.id}`;
          log("GET user", urlUser);
          const resUser = await axios.get(urlUser, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          });
          userContract = resUser.data?.contrat || "CDI";
          log("userContract from API:", userContract);
        } catch (e) {
          log("get user error -> fallback CDI", e?.message);
          userContract = "CDI";
        }
      } else {
        log("userContract from cache:", userContract);
      }
      setContract(userContract);

      // 2) Récup des journées du mois
      const { startISO, endISO } = getMonthBounds(new Date());
      const filter = `user="${user.id}" && date >= "${startISO}" && date <= "${endISO}"`;
      const url = `${PB_URL}/api/collections/journees/records`;
      log("GET journees (month)", { url, filter });

      let page = 1;
      let items = [];
      while (true) {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { perPage: 200, page, filter, sort: "date" },
          timeout: 15000,
        });
        const json = res.data || {};
        const count = (json.items || []).length;
        log("page", page, "status", res?.status, "items", count, "totalPages", json.totalPages);
        items = items.concat(json.items || []);
        if (!json.totalPages || json.page >= json.totalPages) break;
        page += 1;
      }
      log("total items accumulated", items.length);

      // 3) Calculs
      let totalColis = 0;
      let totalAuQuota = 0;
      let totalPrimes = 0;
      let nbJoursQuotaAtteint = 0;
      const q = QUOTA[userContract] ?? QUOTA.CDI;

      for (const e of items) {
        const colis = Number(e.colis || 0);
        const nonWorked = toBool(e.isRepos) || toBool(e.isFerie) || isSundayISO(e.date);
        totalColis += colis;
        if (!nonWorked) {
          totalAuQuota += Math.min(colis, q);
          totalPrimes += Math.max(0, colis - q);
          if (colis >= q) nbJoursQuotaAtteint += 1;
        }
      }

      log("stats computed", { totalColis, totalAuQuota, totalPrimes, nbJoursQuotaAtteint, q });

      setStats({ totalColis, totalAuQuota, totalPrimes, nbJoursQuotaAtteint });
    } catch (e) {
      log("ColisTab error", e?.message, e?.response?.data);
      Alert.alert("Erreur", e?.response?.data?.message || e.message || "Impossible de charger les statistiques.");
      setStats({ totalColis: 0, totalAuQuota: 0, totalPrimes: 0, nbJoursQuotaAtteint: 0 });
    } finally {
      setLoading(false);
      log("fetchUserAndStats finished");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      log("focus -> fetchUserAndStats()");
      fetchUserAndStats();
    }, [fetchUserAndStats])
  );

  useEffect(() => {
    // Hook gardé pour symétrie / logs
    log("contract changed ->", contract);
  }, [contract]);

  return (
    <View style={styles.wrap}>
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
