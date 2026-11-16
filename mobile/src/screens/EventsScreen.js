import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { apiFunciones } from "../services/api";
import EventCard from "../components/EventCard";
import LoadingView from "../components/LoadingView";
import { colors } from "../theme/colors";
import QRCode from "react-native-qrcode-svg";

const inputStyle = { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginTop: 8, color: colors.text };

export default function EventsScreen({ refreshKey, onChanged }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [saving, setSaving] = useState(false);
  const [ticket, setTicket] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setEvents(await apiFunciones.eventos()); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const submit = async () => {
    if (!selected || !form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      Alert.alert("Datos incompletos", "Completa nombre, correo y teléfono."); return;
    }
    setSaving(true);
    try {
      const inscription = await apiFunciones.inscribirse({ ...form, evento_id: selected.id });
      // El backend actual usa pagos simulados: este endpoint confirma la inscripción
      // y permite que la acreditación acepte posteriormente el QR.
      await apiFunciones.pagar(inscription.id, Number(selected.precio || 0) === 0 ? "gratuito" : "tarjeta");
      setTicket(inscription);
      await load();
      onChanged?.();
    } catch (e) { Alert.alert("No se pudo inscribir", e.message); }
    finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800" }}>Eventos</Text>
      <Text style={{ color: colors.muted, marginTop: 3, marginBottom: 16 }}>Consulta eventos e inscribe participantes.</Text>
      <LoadingView loading={loading} error={error} onRetry={load}>
        {events.length === 0 ? <Text style={{ color: colors.muted }}>No hay eventos disponibles.</Text> : events.map((event) => <EventCard key={event.id} event={event} onPress={() => { setSelected(event); setTicket(null); }} />)}
      </LoadingView>

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => { setSelected(null); setTicket(null); }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, flexGrow: 1, backgroundColor: "#fff" }}>
          <TouchableOpacity onPress={() => { setSelected(null); setTicket(null); }}><Text style={{ color: colors.primary, fontWeight: "800" }}>← Volver a eventos</Text></TouchableOpacity>
          {selected && <>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 20 }}>{selected.nombre}</Text>
            <Text style={{ color: colors.muted, marginTop: 8 }}>{selected.fecha} · {selected.lugar}</Text>
            <Text style={{ color: colors.text, marginTop: 14 }}>{selected.descripcion || "Sin descripción."}</Text>
            <Text style={{ color: colors.muted, marginTop: 12 }}>Estado: {selected.estado} · Cupos disponibles: {selected.cupos_disponibles}</Text>
            {ticket ? (
              <View style={{ alignItems: "center", backgroundColor: "#f8fafc", padding: 20, borderRadius: 16, marginTop: 24 }}>
                <Text style={{ fontSize: 18, color: colors.success, fontWeight: "800", marginBottom: 15 }}>Inscripción registrada</Text>
                <QRCode value={ticket.codigo || "SIN-CODIGO"} size={210} />
                <Text style={{ color: colors.text, fontWeight: "800", marginTop: 16 }}>Código: {ticket.codigo}</Text>
                <Text style={{ color: colors.muted, marginTop: 5 }}>Guarda esta entrada para presentarla en el acceso.</Text>
              </View>
            ) : (
              <View style={{ marginTop: 24 }}>
                <Text style={{ color: colors.text, fontWeight: "800", fontSize: 18 }}>Inscribir participante</Text>
                {["nombre", "email", "telefono"].map((key) => (
                  <TextInput key={key} value={form[key]} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))} placeholder={key === "nombre" ? "Nombre completo" : key === "email" ? "Correo electrónico" : "Teléfono (8 a 12 dígitos)"} keyboardType={key === "email" ? "email-address" : key === "telefono" ? "phone-pad" : "default"} autoCapitalize={key === "email" ? "none" : "words"} style={inputStyle} />
                ))}
                <TouchableOpacity disabled={saving || selected.estado !== "publicado" || selected.cupos_disponibles <= 0} onPress={submit} style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 12, marginTop: 18, opacity: saving || selected.estado !== "publicado" || selected.cupos_disponibles <= 0 ? 0.5 : 1 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>{saving ? "Registrando..." : "Confirmar inscripción"}</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 10 }}>La inscripción usa el endpoint público existente. Los pagos continúan sujetos al flujo simulado del backend.</Text>
              </View>
            )}
          </>}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}
