import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { normalizarUrlApi, probarConexion } from "../services/serverConfig";
import { colors } from "../theme/colors";

export default function SettingsScreen({ apiUrl, onSave }) {
  const [direccion, setDireccion] = useState(apiUrl || "");
  const [estado, setEstado] = useState(null);
  const [probando, setProbando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { setDireccion(apiUrl || ""); setEstado(null); }, [apiUrl]);

  const probar = async () => {
    setProbando(true);
    setEstado(null);
    try {
      const info = await probarConexion(direccion);
      setEstado({ correcto: true, texto: "Servidor disponible: " + info.servicio + " (v" + info.version + "). Respuesta: " + info.latenciaMs + " ms." });
    } catch (error) {
      setEstado({ correcto: false, texto: error.message || "No fue posible conectar." });
    } finally {
      setProbando(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setEstado(null);
    try {
      const normalizada = normalizarUrlApi(direccion);
      await onSave(normalizada);
      setEstado({ correcto: true, texto: "Dirección guardada en este dispositivo." });
    } catch (error) {
      setEstado({ correcto: false, texto: error.message || "No se pudo guardar." });
    } finally {
      setGuardando(false);
    }
  };

  const boton = (texto, alPulsar, secundario, ocupado) => (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={probando || guardando}
      onPress={alPulsar}
      style={{ backgroundColor: secundario ? "#ffffff" : colors.primary, borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 12, opacity: probando || guardando ? 0.65 : 1 }}
    >
      {ocupado ? <ActivityIndicator color={secundario ? colors.primary : "#ffffff"} /> :
        <Text style={{ color: secundario ? colors.primary : "#ffffff", fontWeight: "800", textAlign: "center" }}>{texto}</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 44 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>Ajustes de servidor</Text>
      <Text style={{ marginTop: 8, color: colors.muted, lineHeight: 21 }}>
        Configura el backend FastAPI al que se conecta esta aplicación. Puedes cambiar la dirección sin reinstalar la APK.
      </Text>
      <View style={{ marginTop: 20, padding: 18, borderColor: colors.border, borderWidth: 1, borderRadius: 16, backgroundColor: "#ffffff" }}>
        <Text style={{ color: colors.text, fontWeight: "800" }}>Dirección de la API</Text>
        <TextInput
          accessibilityLabel="Dirección del servidor"
          value={direccion}
          onChangeText={(valor) => { setDireccion(valor); setEstado(null); }}
          placeholder="http://192.168.1.50:8000"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.background, marginTop: 10, padding: 13, color: colors.text }}
        />
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
          Puedes indicar la dirección con o sin /api. La comprobación utiliza /salud. Para un teléfono físico, usa la IP de tu PC y la misma red Wi-Fi.
        </Text>
        {boton("Probar conexión", probar, true, probando)}
        {boton("Guardar configuración", guardar, false, guardando)}
        {estado ? <View accessibilityRole="alert" style={{ padding: 12, borderRadius: 10, marginTop: 14, backgroundColor: estado.correcto ? colors.successBg : colors.dangerBg }}>
          <Text style={{ color: estado.correcto ? colors.success : colors.danger, lineHeight: 20 }}>{estado.texto}</Text>
        </View> : null}
      </View>
      <View style={{ marginTop: 18, padding: 16, backgroundColor: "#f1f5f9", borderRadius: 12 }}>
        <Text style={{ color: colors.text, fontWeight: "800" }}>Estado de configuración</Text>
        <Text selectable style={{ color: colors.muted, marginTop: 8 }}>
          {apiUrl ? "Servidor guardado: " + apiUrl : "No hay servidor configurado."}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 }}>
          Al cambiar de servidor se cierra la sesión del organizador para evitar reutilizar credenciales en otra instalación. Prefiere HTTPS cuando el servidor esté publicado. El tráfico HTTP se habilita sólo para demostraciones en una red local de confianza.
        </Text>
      </View>
    </ScrollView>
  );
}
