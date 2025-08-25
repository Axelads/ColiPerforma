// components/DayCard.js
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerModal from "./DatePickerModal";
import SelectField from "./SelectField";

function getWorkDuration(start, end) {
  let diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
  const totalMin = Math.max(0, Math.round(diffMs / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const decimal = Math.round((totalMin / 60) * 100) / 100;
  return { h, m, decimal, totalMin };
}

// 🔒 Normalisation robuste des booléens (gère true/false, "true"/"false", 1/0, "1"/"0")
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

/**
 * props:
 * - prefill: {
 *     date, colis, heuresSupp, heureDebut, heureFin, poste, polyvalence,
 *     isRepos, isFerie
 *   } // toutes optionnelles, date/heure en ISO string possible
 * - disabled: boolean // grise et bloque la saisie
 * - onChange(payload)
 */
export default function DayCard({ prefill, disabled = false, onChange }) {
  // -------- état local avec défauts
  const [date, setDate] = useState(prefill?.date ? new Date(prefill.date) : new Date());
  const [showDate, setShowDate] = useState(false);

  const [hStart, setHStart] = useState(prefill?.heureDebut ? new Date(prefill.heureDebut) : new Date(2000,0,1,10,0,0));
  const [hEnd, setHEnd] = useState(prefill?.heureFin ? new Date(prefill.heureFin) : new Date(2000,0,1,17,21,0));
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const [colis, setColis] = useState(prefill?.colis != null ? String(prefill.colis) : "");
  const [hsupp, setHs]   = useState(prefill?.heuresSupp != null ? String(prefill.heuresSupp) : "");

  const [poste, setPoste] = useState(prefill?.poste ?? null);
  const [poly, setPoly]   = useState(prefill?.polyvalence ?? null);

  // 🛡️ Normalise dès l'init
  const [isRepos, setIsRepos] = useState(toBool(prefill?.isRepos));
  const [isFerie, setIsFerie] = useState(toBool(prefill?.isFerie));

  // -------- resync si le parent change prefill (ex: on revient sur l’onglet)
  useEffect(() => {
    if (!prefill) return;
    if (prefill.date) setDate(new Date(prefill.date));
    if (prefill.heureDebut) setHStart(new Date(prefill.heureDebut));
    if (prefill.heureFin) setHEnd(new Date(prefill.heureFin));
    if (prefill.colis != null) setColis(String(prefill.colis));
    if (prefill.heuresSupp != null) setHs(String(prefill.heuresSupp));
    if (prefill.poste !== undefined) setPoste(prefill.poste);
    if (prefill.polyvalence !== undefined) setPoly(prefill.polyvalence);
    // 🛡️ re-normalise sur update
    setIsRepos(toBool(prefill.isRepos));
    setIsFerie(toBool(prefill.isFerie));
  }, [
    prefill?.date, prefill?.heureDebut, prefill?.heureFin,
    prefill?.colis, prefill?.heuresSupp, prefill?.poste, prefill?.polyvalence,
    prefill?.isRepos, prefill?.isFerie
  ]);

  // calculs
  const isSunday = date.getDay() === 0;
  const nonWorked = isSunday || isRepos || isFerie;
  const worked = useMemo(() => getWorkDuration(hStart, hEnd), [hStart, hEnd]);

  // si non travaillé → forcer 0
  useEffect(() => {
    if (nonWorked) {
      if (colis !== "0") setColis("0");
      if (hsupp !== "0") setHs("0");
    }
  }, [nonWorked]); // eslint-disable-line

  // notifier le parent
  useEffect(() => {
    onChange?.({
      date,
      heureDebut: hStart,
      heureFin: hEnd,
      colis: Number(colis || 0),
      heuresSupp: Number(hsupp || 0),
      poste,
      polyvalence: poly,
      isRepos: toBool(isRepos),
      isFerie: toBool(isFerie),
      heuresTravailles: worked.decimal,
      heuresTravaillesHM: { h: worked.h, m: worked.m },
    });
  }, [date, hStart, hEnd, colis, hsupp, poste, poly, isRepos, isFerie, worked, onChange]);

  const fmtDate = (d) =>
    d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
  const fmtTime = (d) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const dim = disabled ? styles.disabled : null;

  return (
    <View style={styles.card}>
      {/* Badges */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
        {isSunday && <View style={styles.badge}><Text style={styles.badgeTxt}>Dimanche — non travaillé</Text></View>}
        {isFerie &&  <View style={[styles.badge, { borderColor: "#ffcc66" }]}><Text style={styles.badgeTxt}>Jour férié</Text></View>}
        {isRepos &&  <View style={[styles.badge, { borderColor: "#22c55e" }]}><Text style={styles.badgeTxt}>Repos</Text></View>}
      </View>

      {/* Date */}
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Journée</Text>
        <TouchableOpacity
          style={[styles.btnGhost, dim]}
          onPress={() => !disabled && setShowDate(true)}
          disabled={disabled}
        >
          <Text style={styles.btnGhostTxt}>{fmtDate(date)}</Text>
        </TouchableOpacity>
      </View>

      {/* Repos / Férié */}
      <View style={[styles.row, { alignItems: "center" }]}>
        <View style={[styles.col, styles.switchRow]}>
          <Text style={styles.label}>Jour de repos</Text>
          <Switch value={!!isRepos} onValueChange={setIsRepos} thumbColor={isRepos ? "#ffcc66" : "#9aa5b1"} disabled={disabled}/>
        </View>
        <View style={[styles.col, styles.switchRow]}>
          <Text style={styles.label}>Jour férié</Text>
          <Switch value={!!isFerie} onValueChange={setIsFerie} thumbColor={isFerie ? "#ffcc66" : "#9aa5b1"} disabled={disabled}/>
        </View>
      </View>

      {/* Heures */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Heure de début</Text>
          <TouchableOpacity
            style={[styles.btnGhost, (nonWorked || disabled) && styles.disabled]}
            onPress={() => !(nonWorked || disabled) && setShowStart(true)}
            disabled={nonWorked || disabled}
          >
            <Text style={styles.btnGhostTxt}>{fmtTime(hStart)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Heure de fin</Text>
          <TouchableOpacity
            style={[styles.btnGhost, (nonWorked || disabled) && styles.disabled]}
            onPress={() => !(nonWorked || disabled) && setShowEnd(true)}
            disabled={nonWorked || disabled}
          >
            <Text style={styles.btnGhostTxt}>{fmtTime(hEnd)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Colis / HS */}
      {!nonWorked && (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Nombre de colis (total)</Text>
            <TextInput
              style={[styles.input, dim]}
              placeholder="0"
              placeholderTextColor="#8c9199"
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              value={colis}
              onChangeText={setColis}
              returnKeyType="done"
              blurOnSubmit
              editable={!disabled}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Heures supplémentaires</Text>
            <TextInput
              style={[styles.input, dim]}
              placeholder="0"
              placeholderTextColor="#8c9199"
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              value={hsupp}
              onChangeText={setHs}
              returnKeyType="done"
              blurOnSubmit
              editable={!disabled}
            />
          </View>
        </View>
      )}

      {/* Poste / Polyvalence */}
      {!nonWorked && (
        <View style={styles.row}>
          <View style={styles.col}>
            <SelectField
              label="Poste"
              value={poste}
              onChange={setPoste}
              options={[
                { label: "Préparateur", value: "PREPA" },
                { label: "Nettoyage", value: "NETTOYAGE" },
                { label: "Bourreur", value: "BOURREUR" },
                { label: "Box", value: "BOX" },
                { label: "Autre", value: "AUTRE" },
              ]}
              placeholder="Sélectionner…"
            />
          </View>
          <View style={styles.col}>
            <SelectField
              label="Polyvalence"
              value={poly}
              onChange={setPoly}
              options={[
                { label: "Aucune", value: "NONE" },
                { label: "0.5 h", value: "0.5" },
                { label: "1 h", value: "1" },
                { label: "1.5 h", value: "1.5" },
                { label: "2 h", value: "2" },
                { label: "2.5 h", value: "2.5" },
                { label: "3 h", value: "3" },
                { label: "3.5 h", value: "3.5" },
              ]}
              placeholder="Sélectionner…"
            />
          </View>
        </View>
      )}

      {/* Récap */}
      <View style={styles.recap}>
        <Text style={styles.recapTxt}>
          {nonWorked ? (
            <Text style={styles.bold}>Journée non travaillée</Text>
          ) : (
            <>
              ⏱ Heures pointées : <Text style={styles.bold}>{worked.h}h{String(worked.m).padStart(2,"0")}</Text>
              {Number(hsupp || 0) > 0 ? <>  •  + HS : <Text style={styles.bold}>{hsupp} h</Text></> : null}
            </>
          )}
        </Text>
      </View>

      {/* Pickers d'heures */}
      {showStart && !nonWorked && !disabled && (
        <View style={styles.pickerInline}>
          <DateTimePicker
            value={hStart}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, t) => { if (Platform.OS !== "ios") setShowStart(false); if (t) setHStart(t); }}
            themeVariant="dark"
          />
          <TouchableOpacity style={styles.btnClose} onPress={() => setShowStart(false)}>
            <Text style={styles.btnCloseTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}
      {showEnd && !nonWorked && !disabled && (
        <View style={styles.pickerInline}>
          <DateTimePicker
            value={hEnd}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, t) => { if (Platform.OS !== "ios") setShowEnd(false); if (t) setHEnd(t); }}
            themeVariant="dark"
          />
          <TouchableOpacity style={styles.btnClose} onPress={() => setShowEnd(false)}>
            <Text style={styles.btnCloseTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modale calendrier */}
      <DatePickerModal
        visible={showDate}
        initialDate={date}
        onConfirm={(d) => setDate(d)}
        onClose={() => setShowDate(false)}
        title="Date de la journée"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#121722",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  badge: {
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#2a3344",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeTxt: { color: "#c9d1e1", fontSize: 12, fontWeight: "700" },
  title: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: "#9aa5b1", fontSize: 13, marginBottom: 6 },
  btnGhost: {
    backgroundColor: "#0f1115",
    borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: "center",
  },
  btnGhostTxt: { color: "#e6e9ef", fontSize: 15, fontWeight: "600" },
  input: {
    backgroundColor: "#1a1f29",
    borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, color: "#e6e9ef",
  },
  disabled: { opacity: 0.45 },
  recap: {
    marginTop: 4, alignSelf: "flex-start",
    backgroundColor: "#0f1115", borderWidth: 1, borderColor: "#2a3344",
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12,
  },
  recapTxt: { color: "#c9d1e1" },
  bold: { color: "#fff", fontWeight: "800" },
  pickerInline: {
    backgroundColor: "#0f1115",
    borderWidth: 1, borderColor: "#222938",
    borderRadius: 10, padding: 10, marginTop: 6,
  },
  btnClose: {
    marginTop: 8, alignSelf: "flex-end",
    backgroundColor: "#374151", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  btnCloseTxt: { color: "#e5e7eb", fontWeight: "600" },
});
