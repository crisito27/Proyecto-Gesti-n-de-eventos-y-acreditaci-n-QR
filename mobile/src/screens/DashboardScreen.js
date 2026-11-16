import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { apiFunciones } from "../services/api";
import LoadingView from "../components/LoadingView";
import StatCard from "../components/StatCard";
import { colors } from "../theme/colors";

export default function DashboardScreen({ refreshKey, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await apiFunciones.indicadores());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const totalAcreditados = (data?.por_evento || []).reduce(
    (total, item) => total + Number(item.acreditados || 0),
    0
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <View>
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800" }}>
            Resumen general
          </Text>
          <Text style={{ color: colors.muted, marginTop: 3 }}>
            Estado de tus eventos
          </Text>
        </View>

        <TouchableOpacity onPress={load}>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>
            Actualizar
          </Text>
        </TouchableOpacity>
      </View>

      <LoadingView loading={loading} error={error} onRetry={load}>
        {data && (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <StatCard label="Eventos" value={data.total_eventos} />
              <StatCard label="Publicados" value={data.eventos_publicados} />
              <StatCard label="Inscripciones" value={data.total_inscripciones} />
              <StatCard label="Acreditados" value={totalAcreditados} />
              <StatCard
                label="Recaudación"
                value={`$${Number(data.recaudacion_total || 0).toLocaleString("es-CL")}`}
              />
            </View>

            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "800",
                marginTop: 24,
                marginBottom: 12,
              }}
            >
              Ocupación por evento
            </Text>

            {(data.por_evento || []).length === 0 ? (
              <Text style={{ color: colors.muted }}>
                Todavía no hay eventos registrados.
              </Text>
            ) : (
              data.por_evento.map((item) => (
                <View
                  key={item.evento_id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 14,
                    borderColor: colors.border,
                    borderWidth: 1,
                    padding: 15,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontWeight: "800", color: colors.text }}>
                    {item.nombre}
                  </Text>

                  <View
                    style={{
                      height: 9,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 8,
                      marginTop: 12,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.max(0, Math.min(100, Number(item.ocupacion_pct || 0)))}%`,
                        height: 9,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>

                  <Text
                    style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}
                  >
                    {item.inscritos} inscritos · {item.acreditados} acreditados ·{" "}
                    {item.cupos_disponibles} cupos libres
                  </Text>
                </View>
              ))
            )}

            <TouchableOpacity
              onPress={() => onNavigate("escanear")}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                padding: 16,
                marginTop: 12,
              }}
            >
              <Text
                style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}
              >
                Abrir escáner QR
              </Text>
            </TouchableOpacity>
          </>
        )}
      </LoadingView>
    </ScrollView>
  );
}