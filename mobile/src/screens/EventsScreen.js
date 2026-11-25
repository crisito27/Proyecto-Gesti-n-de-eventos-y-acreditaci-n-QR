import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFunciones } from "../services/api";
import { guardarInscripcion } from "../services/almacenamiento";
import EventCard from "../components/EventCard";
import LoadingView from "../components/LoadingView";
import { colors } from "../theme/colors";
import QRCode from "react-native-qrcode-svg";

/* Longitudes máximas de cada campo del formulario.

   Son las mismas que valida el backend en `UsuarioCrear`: nombre de 3 a
   120 caracteres y teléfono de 8 a 12 dígitos. Repetirlas aquí no
   sustituye a la validación del servidor —el teclado del teléfono es
   manipulable y la API tiene que defenderse igual—, pero evita que
   alguien escriba doscientos caracteres y se entere del límite recién
   al pulsar el botón. */
const LIMITES = {
  nombre: 120,
  email: 120,
  telefono: 12,
};

const inputStyle = {
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 10,
  padding: 12,
  marginTop: 8,
  color: colors.text,
};

export default function EventsScreen({ refreshKey, onChanged }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [saving, setSaving] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [pendingInscription, setPendingInscription] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setEvents(await apiFunciones.eventos());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const completarPago = async (inscription) => {
    // Primero verificamos si el pago ya fue registrado.
    // Esto evita duplicarlo si se perdió la respuesta anterior.
    const actual = await apiFunciones.obtenerInscripcion(
      inscription.id,
      inscription.codigo
    );

    if (actual.pagada) {
      setTicket(actual);
      setPendingInscription(null);
      await load();
      onChanged?.();
      return;
    }

    const metodo =
      Number(selected.precio || 0) === 0
        ? "gratuito"
        : "tarjeta";

    await apiFunciones.pagar(
      inscription.id,
      inscription.codigo,
      metodo
    );

    // Confirmamos el estado directamente en el backend.
    const confirmada = await apiFunciones.obtenerInscripcion(
      inscription.id,
      inscription.codigo
    );

    if (!confirmada.pagada) {
      throw new Error(
        "El servidor todavía no confirma el pago. Puedes volver a intentarlo."
      );
    }

    setTicket(confirmada);
    setPendingInscription(null);
    await load();
    onChanged?.();
  };

  const submit = async () => {
    if (
      !selected ||
      !form.nombre.trim() ||
      !form.email.trim() ||
      !form.telefono.trim()
    ) {
      Alert.alert(
        "Datos incompletos",
        "Completa nombre, correo y teléfono."
      );
      return;
    }

    setSaving(true);

    try {
      const inscription = await apiFunciones.inscribirse({
        ...form,
        evento_id: selected.id,
      });

      const pendiente = {
        ...inscription,
        eventoId: selected.id,
      };

      // Guardamos el identificador y código para reutilizarlos
      // si el pago necesita un segundo intento.
      setPendingInscription(pendiente);

      // Referencia local para la pantalla "Mis entradas". Sólo el id y
      // el código: el estado se consulta siempre al backend.
      await guardarInscripcion({
        id: inscription.id,
        codigo: inscription.codigo,
        evento: selected.nombre,
        fecha: selected.fecha,
      });

      await completarPago(pendiente);
    } catch (e) {
      Alert.alert(
        "Inscripción creada o pago pendiente",
        e.message || "No se pudo completar la operación."
      );
    } finally {
      setSaving(false);
    }
  };

  const reintentarPago = async () => {
    if (!pendingInscription) return;

    setSaving(true);

    try {
      await completarPago(pendingInscription);
    } catch (e) {
      Alert.alert(
        "No se pudo confirmar el pago",
        e.message || "Comprueba la conexión e inténtalo nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  const seleccionarEvento = (event) => {
    if (
      pendingInscription &&
      pendingInscription.eventoId !== event.id
    ) {
      Alert.alert(
        "Pago pendiente",
        "Primero completa el pago de tu inscripción pendiente."
      );
      return;
    }

    setSelected(event);
    setTicket(null);
  };

  const cerrarModal = () => {
    setSelected(null);
    setTicket(null);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 30,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 21,
          fontWeight: "800",
        }}
      >
        Eventos
      </Text>

      <Text
        style={{
          color: colors.muted,
          marginTop: 3,
          marginBottom: 16,
        }}
      >
        Consulta eventos e inscribe participantes.
      </Text>

      <LoadingView
        loading={loading}
        error={error}
        onRetry={load}
      >
        {events.length === 0 ? (
          <Text style={{ color: colors.muted }}>
            No hay eventos disponibles.
          </Text>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => seleccionarEvento(event)}
            />
          ))
        )}
      </LoadingView>

      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={cerrarModal}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingTop: 50,
            flexGrow: 1,
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity onPress={cerrarModal}>
            <Text
              style={{
                color: colors.primary,
                fontWeight: "800",
              }}
            >
              ← Volver a eventos
            </Text>
          </TouchableOpacity>

          {selected && (
            <>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: "800",
                  marginTop: 20,
                }}
              >
                {selected.nombre}
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  marginTop: 8,
                }}
              >
                {selected.fecha} · {selected.lugar}
              </Text>

              <Text
                style={{
                  color: colors.text,
                  marginTop: 14,
                }}
              >
                {selected.descripcion || "Sin descripción."}
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  marginTop: 12,
                }}
              >
                Estado: {selected.estado} · Cupos disponibles:{" "}
                {selected.cupos_disponibles}
              </Text>

              {ticket ? (
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: "#f8fafc",
                    padding: 20,
                    borderRadius: 16,
                    marginTop: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: colors.success,
                      fontWeight: "800",
                      marginBottom: 15,
                    }}
                  >
                    Inscripción confirmada
                  </Text>

                  <QRCode
                    value={ticket.codigo}
                    size={210}
                  />

                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "800",
                      marginTop: 16,
                    }}
                  >
                    Código: {ticket.codigo}
                  </Text>

                  <Text
                    style={{
                      color: colors.muted,
                      marginTop: 5,
                      textAlign: "center",
                    }}
                  >
                    Guarda esta entrada para presentarla en el acceso.
                  </Text>
                </View>
              ) : pendingInscription ? (
                <View
                  style={{
                    backgroundColor: "#fff7ed",
                    padding: 18,
                    borderRadius: 14,
                    marginTop: 24,
                    borderWidth: 1,
                    borderColor: "#fed7aa",
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: "800",
                    }}
                  >
                    Inscripción pendiente de pago
                  </Text>

                  <Text
                    style={{
                      color: colors.muted,
                      marginTop: 8,
                      lineHeight: 20,
                    }}
                  >
                    Tu inscripción ya fue creada. No necesitas registrarte
                    nuevamente. Puedes comprobar o reintentar el pago.
                  </Text>

                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      marginTop: 12,
                    }}
                  >
                    Código de inscripción: {pendingInscription.codigo}
                  </Text>

                  <TouchableOpacity
                    disabled={saving}
                    onPress={reintentarPago}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 15,
                      borderRadius: 12,
                      marginTop: 18,
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "800",
                        textAlign: "center",
                      }}
                    >
                      {saving ? "Comprobando pago..." : "Reintentar / comprobar pago"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 24 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "800",
                      fontSize: 18,
                    }}
                  >
                    Inscribir participante
                  </Text>

                  {["nombre", "email", "telefono"].map((key) => (
                    <TextInput
                      key={key}
                      value={form[key]}
                      onChangeText={(value) =>
                        setForm((old) => ({
                          ...old,
                          // El teléfono sólo admite dígitos. Se descartan
                          // los demás caracteres mientras se escribe, en
                          // vez de avisar del error recién al enviar.
                          [key]:
                            key === "telefono"
                              ? value.replace(/\D/g, "")
                              : value,
                        }))
                      }
                      maxLength={LIMITES[key]}
                      placeholder={
                        key === "nombre"
                          ? "Nombre completo"
                          : key === "email"
                            ? "Correo electrónico"
                            : "Teléfono (8 a 12 dígitos)"
                      }
                      keyboardType={
                        key === "email"
                          ? "email-address"
                          : key === "telefono"
                            ? "phone-pad"
                            : "default"
                      }
                      autoCapitalize={
                        key === "email" ? "none" : "words"
                      }
                      style={inputStyle}
                      editable={!saving}
                    />
                  ))}

                  <TouchableOpacity
                    disabled={
                      saving ||
                      selected.estado !== "publicado" ||
                      selected.cupos_disponibles <= 0
                    }
                    onPress={submit}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 15,
                      borderRadius: 12,
                      marginTop: 18,
                      opacity:
                        saving ||
                        selected.estado !== "publicado" ||
                        selected.cupos_disponibles <= 0
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "800",
                        textAlign: "center",
                      }}
                    >
                      {saving ? "Procesando..." : "Confirmar inscripción"}
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 11,
                      marginTop: 10,
                    }}
                  >
                    Los pagos se procesan mediante el sistema simulado
                    del backend.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}