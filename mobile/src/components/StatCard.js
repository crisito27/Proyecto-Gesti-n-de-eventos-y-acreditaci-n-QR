import React from "react";
import { Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function StatCard({ label, value, hint }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, flex: 1, minWidth: "45%", borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 27, fontWeight: "800", marginTop: 6 }}>{value ?? "—"}</Text>
      {!!hint && <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{hint}</Text>}
    </View>
  );
}
