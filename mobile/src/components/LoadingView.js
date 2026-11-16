import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function LoadingView({ loading, error, onRetry, children }) {
  if (loading) return <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.muted, marginTop: 10 }}>Cargando información...</Text></View>;
  if (error) return <View style={{ margin: 16, padding: 16, backgroundColor: "#fee2e2", borderRadius: 14 }}><Text style={{ color: colors.danger, fontWeight: "700" }}>{error.message || "Ocurrió un error."}</Text><Text onPress={onRetry} style={{ color: colors.primary, fontWeight: "800", marginTop: 12 }}>Volver a intentar</Text></View>;
  return children;
}
