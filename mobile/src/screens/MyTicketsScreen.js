/* =========================================================
   MyTicketsScreen — "Mis entradas".

   Cubre el tercer flujo obligatorio del caso 3.6: consultar las
   inscripciones propias y sus comprobantes disponibles.

   Cómo sabe cuáles son "propias": el dispositivo guarda local-
   mente el id y el código de cada inscripción hecha desde aquí
   (ver services/almacenamiento.js). Con esas referencias pide a la
   API el estado actual de cada una. Los datos nunca salen del
   almacenamiento local: siempre vienen del backend.
   ========================================================= */

import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import LoadingView from "../components/LoadingView";
import { apiFunciones } from "../services/api";
import {
  listarMisInscripciones,
  olvidarInscripcion,
} from "../services/almacenamiento";
import { colors } from "../theme/colors";

const ETIQUETA_ESTADO = {
  pendiente_pago: "Pendiente de pago",
  confirmada: "Confirmada",
  acreditada: "Asistencia registrada",
  cancelada: "Cancelada",
};

const COLOR_ESTADO = {
  pendiente_pago: { texto: colors.warning, fondo: colors.warningBg },
  confirmada: { texto: colors.primary, fondo: "#dbeafe" },
  acreditada: { texto: colors.success, fondo: colors.successBg },
  cancelada: { texto: colors.danger, fondo: colors.dangerBg },
};

const formatearFecha = (iso) => {
  if (!iso) return "Fecha no disponible";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (_) {
    return iso;
  }
};

const formatearPrecio = (valor) => {
  const numero = Number(valor || 0);
  if (numero === 0) return "Gratuito";
  return `$${numero.toLocaleString("es-CL")}`;
};

export default function MyTicketsScreen({ refreshKey, onNavigate }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comprobantes ya consultados, por id de inscripción.
  const [comprobantes, setComprobantes] = useState({});
  const [cargandoComprobante, setCargandoComprobante] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const referencias = await listarMisInscripciones();

      if (referencias.length === 0) {
        setInscripciones([]);
        return;
      }

      // Se consulta el estado actual de cada entrada en el backend.
      // Si alguna ya no existe, se descarta sin romper la pantalla.
      const resultados = await Promise.all(
        referencias.map(async (referencia) => {
          try {
            const detalle = await apiFunciones.obtenerInscripcion(
              referencia.id,
              referencia.codigo
            );
            return { ...detalle, codigoLocal: referencia.codigo };
          } catch (_) {
            return null;
          }
        })
      );

      setInscripciones(resultados.filter(Boolean));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const verComprobante = async (inscripcion) => {
    if (comprobantes[inscripcion.id]) {
      // Ya está abierto: se cierra.
      setComprobantes((previo) => {
        const copia = { ...previo };
        delete copia[inscripcion.id];
        return copia;
      });
      return;
    }

    setCargandoComprobante(inscripcion.id);

    try {
      const datos = await apiFunciones.comprobante(
        inscripcion.pago_id,
        inscripcion.codigo
      );
      setComprobantes((previo) => ({ ...previo, [inscripcion.id]: datos }));
    } catch (e) {
      setComprobantes((previo) => ({
        ...previo,
        [inscripcion.id]: {
          error: e?.message || "No se pudo obtener el comprobante.",
        },
      }));
    } finally {
      setCargandoComprobante(null);
    }
  };

  const quitar = async (id) => {
    await olvidarInscripcion(id);
    load();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800" }}>
            Mis entradas
          </Text>
          <Text style={{ color: colors.muted, marginTop: 3 }}>
            Inscripciones hechas desde este dispositivo
          </Text>
        </View>

        <TouchableOpacity onPress={load}>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>
            Actualizar
          </Text>
        </TouchableOpacity>
      </View>

      <LoadingView loading={loading} error={error} onRetry={load}>
        {inscripciones.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 34, marginBottom: 8 }}>▢</Text>
            <Text
              style={{
                color: colors.text,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Todavía no tienes entradas
            </Text>
            <Text
              style={{
                color: colors.muted,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Inscríbete en un evento y tu entrada aparecerá aquí.
            </Text>

            {onNavigate ? (
              <TouchableOpacity
                onPress={() => onNavigate("eventos")}
                style={{
                  marginTop: 16,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 11,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  Ver eventos
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          inscripciones.map((inscripcion) => {
            const estado = inscripcion.estado || "confirmada";
            const paleta = COLOR_ESTADO[estado] || {
              texto: colors.muted,
              fondo: colors.border,
            };
            const comprobante = comprobantes[inscripcion.id];

            return (
              <View
                key={inscripcion.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: paleta.fondo,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: paleta.texto,
                      fontSize: 11,
                      fontWeight: "900",
                    }}
                  >
                    {(ETIQUETA_ESTADO[estado] || estado).toUpperCase()}
                  </Text>
                </View>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {inscripcion.evento?.nombre || "Evento"}
                </Text>

                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
                  {formatearFecha(inscripcion.evento?.fecha)}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {inscripcion.evento?.lugar || "Lugar no indicado"}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {inscripcion.usuario?.nombre || ""}
                </Text>

                <View
                  style={{
                    alignItems: "center",
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#fff",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <QRCode value={inscripcion.codigo} size={118} />
                  </View>

                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      marginTop: 10,
                      letterSpacing: 0.5,
                    }}
                  >
                    {inscripcion.codigo}
                  </Text>

                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    Presenta este código en la entrada del evento.
                  </Text>
                </View>

                {/* --- Comprobante --- */}
                <View
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  {inscripcion.pagada && inscripcion.pago_id ? (
                    <>
                      <TouchableOpacity
                        onPress={() => verComprobante(inscripcion)}
                        disabled={cargandoComprobante === inscripcion.id}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontWeight: "800",
                          }}
                        >
                          {cargandoComprobante === inscripcion.id
                            ? "Consultando comprobante..."
                            : comprobante
                            ? "Ocultar comprobante"
                            : `Ver comprobante ${
                                inscripcion.numero_comprobante || ""
                              }`.trim()}
                        </Text>
                      </TouchableOpacity>

                      {comprobante ? (
                        comprobante.error ? (
                          <Text
                            style={{
                              color: colors.danger,
                              marginTop: 8,
                              fontSize: 13,
                            }}
                          >
                            {comprobante.error}
                          </Text>
                        ) : (
                          <View
                            style={{
                              backgroundColor: colors.background,
                              borderRadius: 10,
                              padding: 12,
                              marginTop: 10,
                            }}
                          >
                            <Text
                              style={{
                                color: colors.muted,
                                fontSize: 11,
                                fontWeight: "900",
                                letterSpacing: 1,
                              }}
                            >
                              COMPROBANTE DE PAGO
                            </Text>

                            <Text
                              style={{
                                color: colors.text,
                                fontWeight: "800",
                                marginTop: 4,
                              }}
                            >
                              {comprobante.numero_comprobante}
                            </Text>

                            <Text
                              style={{
                                color: colors.muted,
                                fontSize: 13,
                                marginTop: 8,
                              }}
                            >
                              Monto: {formatearPrecio(comprobante.monto)}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 13 }}>
                              Método: {comprobante.metodo}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 13 }}>
                              Emitido:{" "}
                              {comprobante.emitido_en
                                ? new Date(
                                    comprobante.emitido_en
                                  ).toLocaleString("es-CL")
                                : "—"}
                            </Text>

                            <Text
                              style={{
                                color: colors.muted,
                                fontSize: 11,
                                marginTop: 10,
                                fontStyle: "italic",
                              }}
                            >
                              Transacción simulada con fines académicos.
                            </Text>
                          </View>
                        )
                      ) : null}
                    </>
                  ) : (
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {estado === "pendiente_pago"
                        ? "Esta inscripción no tiene pago confirmado, por lo que todavía no hay comprobante."
                        : "Sin comprobante asociado."}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => quitar(inscripcion.id)}
                  style={{ marginTop: 14 }}
                >
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    Quitar de este dispositivo
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </LoadingView>
    </ScrollView>
  );
}
