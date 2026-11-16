import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/colors";

export default function EventCard({ event, onPress }) {
  const date = event.fecha ? new Date(`${event.fecha}T12:00:00`).toLocaleDateString("es-CL") : "Fecha por confirmar";
  const status = String(event.estado || "").toLowerCase();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800", flex: 1, paddingRight: 8 }}>{event.nombre}</Text>
        <Text style={{ color: status === "publicado" ? colors.success : colors.warning, fontSize: 11, fontWeight: "800" }}>{event.estado || "—"}</Text>
      </View>
      <Text style={{ color: colors.muted, marginTop: 7 }}>{date} · {event.lugar || "Lugar por confirmar"}</Text>
      <Text style={{ color: colors.muted, marginTop: 5, fontSize: 12 }}>{event.inscritos ?? 0} inscritos · {event.cupos_disponibles ?? 0} cupos disponibles</Text>
      <Text style={{ color: colors.primary, fontWeight: "800", marginTop: 12 }}>Ver detalles →</Text>
    </TouchableOpacity>
  );
}
