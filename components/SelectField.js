// components/SelectField.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Sélectionner…",
  modalTitle,
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value && { opacity: 0.7 }]}>
          {selectedLabel}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{modalTitle || label}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.optionTxt}>{item.label}</Text>
                    {isSelected ? <Text style={styles.check}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: 320 }}
            />

            <TouchableOpacity style={styles.footerClose} onPress={() => setOpen(false)}>
              <Text style={styles.footerCloseTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#c9d1e1",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 6,
  },
  field: {
    backgroundColor: "#121722",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  fieldText: {
    color: "#e6e9ef",
    fontSize: 15,
    fontWeight: "600",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#0f1115",
    borderWidth: 1,
    borderColor: "#222938",
    borderRadius: 16,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  closeTxt: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 14,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: "space-between",
  },
  optionTxt: {
    color: "#e6e9ef",
    fontSize: 15,
  },
  check: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#1c2331",
    opacity: 0.7,
  },

  footerClose: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  footerCloseTxt: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
});
