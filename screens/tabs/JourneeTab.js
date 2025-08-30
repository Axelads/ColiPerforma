// screens/tabs/JourneeTab.js
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DayCard from "../../components/DayCard";
import SaveBar from "../../components/SaveBar";
import axios from "axios";

// ⚠️ normalise pour éviter //api
const PB_URL_RAW = "https://cooing-emalee-axelads-7ec4b898.koyeb.app/";
const PB_URL = PB_URL_RAW.replace(/\/+$/, "");

const log = (...args) => console.log("[JourneeTab]", ...args);

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

export default function JourneeTab() {
  const [dayData, setDayData] = useState(null);   // données de la DayCard
  const [existing, setExisting] = useState(null); // record PocketBase du jour (s'il existe)
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true); // false = lecture seule quand une entrée existe

  // --------- Utils
  const getDayBoundsISO = (d) => {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  };

  // Pré-remplissage de la DayCard quand un record existe
  const prefill = useMemo(() => {
    if (!existing) return null;
    const pf = {
      date: existing.date,
      heureDebut: existing.heureDebut,
      heureFin: existing.heureFin,
      colis: existing.colis,
      heuresSupp: existing.heuresSupp,
      poste: existing.poste ?? null,
      polyvalence: existing.polyvalence ?? null,
      isRepos: toBool(existing.isRepos),
      isFerie: toBool(existing.isFerie),
    };
    log("prefill from existing", pf);
    return pf;
  }, [existing]);

  // --------- Vérifier s'il existe déjà une entrée pour la date choisie
  useEffect(() => {
    const run = async () => {
      try {
        if (!dayData?.date) {
          log("skip checkExisting: no dayData.date yet");
          return;
        }
        setChecking(true);

        const token = await AsyncStorage.getItem("pb_token");
        const userRaw = await AsyncStorage.getItem("pb_model");
        const user = userRaw ? JSON.parse(userRaw) : null;

        log("checkExisting -> token?", !!token, "userId?", user?.id, "date", dayData.date);

        if (!token || !user?.id) {
          setExisting(null);
          setEditMode(true);
          return;
        }

        const { startISO, endISO } = getDayBoundsISO(dayData.date);
        const filter = `user="${user.id}" && date >= "${startISO}" && date <= "${endISO}"`;
        const url = `${PB_URL}/api/collections/journees/records`;

        log("GET journees", { url, filter });

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { perPage: 1, filter },
          timeout: 15000,
        });

        log("GET status", res?.status, "keys", Object.keys(res?.data || {}));

        const json = res.data;
        if (json?.items?.length) {
          log("existing found", json.items[0]?.id);
          setExisting(json.items[0]);
          setEditMode(false); // on verrouille par défaut si déjà enregistré
        } else {
          log("no existing entry for day");
          setExisting(null);
          setEditMode(true);  // pas d'entrée => mode édition
        }
      } catch (e) {
        log("checkExisting error", e?.message, e?.response?.data);
        setExisting(null);
        setEditMode(true);
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [dayData?.date]);

  // --------- Enregistrer (create ou update)
  // Doit retourner true si OK (pour que SaveBar déclenche la pub)
  const onSave = async () => {
    if (!dayData) {
      log("onSave aborted: no dayData");
      return false;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      log("onSave -> token?", !!token, "userId?", user?.id);

      if (!token || !user?.id) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return false;
      }

      const payload = {
        user: user.id,
        date: new Date(dayData.date).toISOString(),
        colis: Number(dayData.colis || 0),
        heuresSupp: Number(dayData.heuresSupp || 0),
        heureDebut: dayData.heureDebut ? new Date(dayData.heureDebut).toISOString() : null,
        heureFin: dayData.heureFin ? new Date(dayData.heureFin).toISOString() : null,
        poste: dayData.poste || null,
        polyvalence: dayData.polyvalence || null,
        isRepos: toBool(dayData.isRepos),
        isFerie: toBool(dayData.isFerie),
      };

      log(existing?.id ? "PATCH payload" : "POST payload", payload);

      if (existing?.id) {
        // UPDATE
        const url = `${PB_URL}/api/collections/journees/records/${existing.id}`;
        const res = await axios.patch(url, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        });
        log("PATCH status", res?.status);
        const json = res.data;
        setExisting(json);
        setEditMode(false);
        Alert.alert("✅ Modifié", "La journée a été mise à jour.");
      } else {
        // CREATE
        const url = `${PB_URL}/api/collections/journees/records`;
        const res = await axios.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        });
        log("POST status", res?.status);
        const json = res.data;
        setExisting(json);
        setEditMode(false);
        Alert.alert("✅ Enregistré", "La journée a bien été sauvegardée.");
      }

      Keyboard.dismiss();
      return true; // ✅ succès → SaveBar affichera la pub
    } catch (err) {
      log("save error", err?.message, err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Impossible d'enregistrer.";
      Alert.alert("Erreur", msg);
      return false;
    } finally {
      setSaving(false);
      log("onSave finished");
    }
  };

  // --------- UI
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => log("Scroll started")}
        >
          <DayCard
            prefill={prefill}
            disabled={!editMode}
            onChange={(d) => {
              setDayData(d);
              if (__DEV__) log("DayCard onChange", {
                hasDate: !!d?.date,
                colis: d?.colis,
                hs: d?.heuresSupp,
                isRepos: toBool(d?.isRepos),
                isFerie: toBool(d?.isFerie),
              });
            }}
          />

          <SaveBar
            checking={checking}
            editMode={editMode}
            saving={saving}
            hasExisting={!!existing}
            onSave={onSave}
            onEnableEdit={() => { log("Enable edit clicked"); setEditMode(true); }}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnTxt: {
    color: "#0f1115",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  btnGhost: {
    backgroundColor: "#121722",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnGhostTxt: {
    color: "#e6e9ef",
    fontSize: 15,
    fontWeight: "700",
  },
  pillMuted: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 999,
    paddingVertical: 10,
  },
  pillMutedTxt: { color: "#c9d1e1", fontWeight: "600" },
});
