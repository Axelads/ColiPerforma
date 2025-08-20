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
import SaveBar from "../../components/SaveBar"; // ✅ barre d’actions réutilisable

const PB_URL = "https://cooing-emalee-axelads-7ec4b898.koyeb.app";

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
    return {
      date: existing.date,
      heureDebut: existing.heureDebut,
      heureFin: existing.heureFin,
      colis: existing.colis,
      heuresSupp: existing.heuresSupp,
      poste: existing.poste ?? null,
      polyvalence: existing.polyvalence ?? null,
      isRepos: !!existing.isRepos,
      isFerie: !!existing.isFerie,
    };
  }, [existing]);

  // --------- Vérifier s'il existe déjà une entrée pour la date choisie
  useEffect(() => {
    const run = async () => {
      if (!dayData?.date) return;
      try {
        setChecking(true);

        const token = await AsyncStorage.getItem("pb_token");
        const userRaw = await AsyncStorage.getItem("pb_model");
        const user = userRaw ? JSON.parse(userRaw) : null;

        if (!token || !user?.id) {
          setExisting(null);
          setEditMode(true);
          return;
        }

        const { startISO, endISO } = getDayBoundsISO(dayData.date);
        const filter = encodeURIComponent(
          `user="${user.id}" && date >= "${startISO}" && date <= "${endISO}"`
        );

        const res = await fetch(
          `${PB_URL}/api/collections/journees/records?perPage=1&filter=${filter}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();

        if (res.ok && json?.items?.length) {
          setExisting(json.items[0]);
          setEditMode(false); // on verrouille par défaut si déjà enregistré
        } else {
          setExisting(null);
          setEditMode(true);  // pas d'entrée => mode édition
        }
      } catch (e) {
        console.log("checkExisting error:", e);
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
    if (!dayData) return false;

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("pb_token");
      const userRaw = await AsyncStorage.getItem("pb_model");
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!token || !user?.id) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return false;
      }

      const payload = {
        user: user.id,
        date: new Date(dayData.date).toISOString(),
        colis: Number(dayData.colis || 0),
        heuresSupp: Number(dayData.heuresSupp || 0),
        heureDebut: new Date(dayData.heureDebut).toISOString(),
        heureFin: new Date(dayData.heureFin).toISOString(),
        poste: dayData.poste || null,
        polyvalence: dayData.polyvalence || null,
        isRepos: !!dayData.isRepos,
        isFerie: !!dayData.isFerie,
      };

      let res, json;

      if (existing?.id) {
        // UPDATE
        res = await fetch(`${PB_URL}/api/collections/journees/records/${existing.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Échec de la mise à jour.");
        setExisting(json);
        setEditMode(false);
        Alert.alert("✅ Modifié", "La journée a été mise à jour.");
      } else {
        // CREATE
        res = await fetch(`${PB_URL}/api/collections/journees/records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Échec de l'enregistrement.");
        setExisting(json);
        setEditMode(false);
        Alert.alert("✅ Enregistré", "La journée a bien été sauvegardée.");
      }

      Keyboard.dismiss();
      return true; // ✅ succès → SaveBar affichera la pub
    } catch (err) {
      console.error("save error:", err);
      Alert.alert("Erreur", err.message || "Impossible d'enregistrer.");
      return false;
    } finally {
      setSaving(false);
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
        >
          {/* Carte du jour */}
          <DayCard
            prefill={prefill}
            disabled={!editMode}     // grisé si lecture seule
            onChange={setDayData}    // remonte en temps réel
          />

          {/* Barre d’actions + pub (via SaveBar) */}
          <SaveBar
            checking={checking}
            editMode={editMode}
            saving={saving}
            hasExisting={!!existing}
            onSave={onSave}
            onEnableEdit={() => setEditMode(true)}
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
