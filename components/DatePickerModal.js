// components/DatePickerModal.js
import React, { useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

// ----- Locale FR -----
LocaleConfig.locales.fr = {
  monthNames: [
    "janvier","février","mars","avril","mai","juin",
    "juillet","août","septembre","octobre","novembre","décembre"
  ],
  monthNamesShort: [
    "janv.","févr.","mars","avr.","mai","juin",
    "juil.","août","sept.","oct.","nov.","déc."
  ],
  dayNames: [
    "dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"
  ],
  dayNamesShort: ["dim.","lun.","mar.","mer.","jeu.","ven.","sam."],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";

function dateToYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePickerModal({
  visible,
  initialDate = new Date(),
  onConfirm,
  onClose,
  title = "Choisir une date",
  minDate,
  maxDate,
}) {
  const initial = useMemo(() => dateToYYYYMMDD(initialDate), [initialDate]);
  const [selected, setSelected] = useState(initial);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <Calendar
            current={selected}
            onDayPress={(day) => setSelected(day.dateString)}
            markedDates={{
              [selected]: { selected: true, disableTouchEvent: false, selectedColor: "#22c55e", selectedTextColor: "#0f1115" },
            }}
            minDate={minDate ? dateToYYYYMMDD(minDate) : undefined}
            maxDate={maxDate ? dateToYYYYMMDD(maxDate) : undefined}
            theme={{
              calendarBackground: "#0f1115",
              textSectionTitleColor: "#9aa5b1",
              dayTextColor: "#ffffff",
              todayTextColor: "#8ab4ff",
              monthTextColor: "#ffffff",
              arrowColor: "#e6e9ef",
              textDisabledColor: "#5b6472",
            }}
            firstDay={1}
            enableSwipeMonths
          />

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              const [y, m, d] = selected.split("-").map((n) => parseInt(n, 10));
              onConfirm(new Date(y, m - 1, d));
              onClose();
            }}
          >
            <Text style={styles.confirmTxt}>Valider</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20,
  },
  card: {
    backgroundColor: "#0f1115",
    borderWidth: 1, borderColor: "#222938",
    borderRadius: 16, padding: 14,
  },
  header: {
    flexDirection: "row", alignItems: "center", marginBottom: 8,
  },
  title: {
    flex: 1, color: "#ffffff", fontSize: 16, fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "#1f2937", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  closeTxt: {
    color: "#e5e7eb", fontWeight: "700", fontSize: 14,
  },
  confirmBtn: {
    marginTop: 12, alignSelf: "flex-end",
    backgroundColor: "#22c55e", borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  confirmTxt: {
    color: "#0f1115", fontWeight: "800",
  },
});
