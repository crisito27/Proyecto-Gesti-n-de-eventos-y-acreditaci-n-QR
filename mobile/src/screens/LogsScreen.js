import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { apiFunciones } from "../services/api";
import LoadingView from "../components/LoadingView";
import { colors } from "../theme/colors";

const colorFor = (value) => value === "acreditado" ? colors.success : ["duplicado", "sin_pago"].includes(value) ? colors.warning : colors.danger;

export default function LogsScreen({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await apiFunciones.registros(undefined, 100)); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View><Text style={{ color: colors.text, fontSize: 21, fontWeight: "800" }}>Bitácora de accesos</Text><Text style={{ color: colors.muted, marginTop: 3 }}>Últimos 100 intentos registrados</Text></View>
        <TouchableOpacity onPress={load}><Text style={{ color: colors.primary, fontWeight: "800" }}>Actualizar</Text></TouchableOpacity>
      </View>
      <LoadingView loading={loading} error={error} onRetry={load}>
        {items.length === 0 ? <Text style={{ color: colors.muted }}>Todavía no hay intentos de acceso.</Text> : items.map((item, index) => (
          <View key={item.id || `${item.codigo}-${index}`} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colorFor(item.resultado), fontWeight: "900" }}>{String(item.resultado || "sin resultado").replaceAll("_", " ").toUpperCase()}</Text>
            <Text style={{ color: colors.text, fontWeight: "700", marginTop: 5 }}>{item.codigo || "Sin código"}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.puerta || "Puerta no indicada"} · {item.ocurrido_en ? new Date(item.ocurrido_en).toLocaleString("es-CL") : "Fecha no disponible"}</Text>
          </View>
        ))}
      </LoadingView>
    </ScrollView>
  );
}
