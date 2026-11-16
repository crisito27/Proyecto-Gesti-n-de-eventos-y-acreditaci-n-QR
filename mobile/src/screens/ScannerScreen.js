import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { apiFunciones } from "../services/api";
import { colors } from "../theme/colors";

const labels = {
  acreditado: { title: "ACCESO AUTORIZADO", color: colors.success, bg: colors.successBg },
  duplicado: { title: "ENTRADA YA UTILIZADA", color: colors.warning, bg: colors.warningBg },
  sin_pago: { title: "PAGO PENDIENTE", color: colors.warning, bg: colors.warningBg },
  cancelada: { title: "INSCRIPCIÓN CANCELADA", color: colors.danger, bg: colors.dangerBg },
  evento_no_publicado: { title: "EVENTO NO PUBLICADO", color: colors.warning, bg: colors.warningBg },
  codigo_invalido: { title: "CÓDIGO NO VÁLIDO", color: colors.danger, bg: colors.dangerBg },
};

function normalizarCodigoQR(raw) {
  const value = String(raw || "").trim();
  // El QR del proyecto contiene el código de inscripción como texto plano.
  // Si más adelante contiene una URL/JSON, adapta esta función.
  return value;
}

export default function ScannerScreen({ onAccredited }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState(false);
  const [code, setCode] = useState("");
  const [door, setDoor] = useState("principal");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [lastScanned, setLastScanned] = useState("");
  const [scanned, setScanned] = useState(false);

  const accredit = async (value = code) => {
    const normalized = normalizarCodigoQR(value);
    if (!normalized) { Alert.alert("Falta el código", "Escanea un QR o escribe el código de la entrada."); return; }
    setBusy(true); setResult(null);
    try {
      const response = await apiFunciones.acreditar(normalized, door);
      setResult(response);
      setCode("");
      setCamera(false);
      setScanned(false);
      onAccredited?.();
    } catch (e) {
      Alert.alert("Error de conexión", e.message);
    } finally { setBusy(false); }
  };

  const onBarcodeScanned = ({ data }) => {
    if (scanned || busy) return;
    setScanned(true);
    const value = normalizarCodigoQR(data);
    setLastScanned(value);
    setCode(value);
    setCamera(false);
    // No se acredita automáticamente: el operador confirma el código.
  };

  const status = result ? (labels[result.resultado] || { title: result.resultado, color: colors.text, bg: colors.background }) : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: "800" }}>Acreditación</Text>
      <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 18 }}>Escanea la entrada o ingresa el código manualmente.</Text>

      {camera ? (
        <View style={{ height: 330, borderRadius: 18, overflow: "hidden", backgroundColor: "#000" }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : onBarcodeScanned} />
          <View style={{ position: "absolute", bottom: 12, left: 12, right: 12, backgroundColor: "rgba(15,23,42,0.8)", padding: 12, borderRadius: 10 }}>
            <Text style={{ color: "#fff", textAlign: "center" }}>Enfoca el código QR dentro del encuadre</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity onPress={async () => {
          if (!permission?.granted) {
            const p = await requestPermission();
            if (!p.granted) { Alert.alert("Permiso requerido", "Debes permitir el uso de la cámara para escanear QR."); return; }
          }
          setScanned(false); setCamera(true);
        }} style={{ height: 150, borderRadius: 18, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontSize: 34 }}>▣</Text>
          <Text style={{ color: "#fff", fontWeight: "800", marginTop: 8 }}>Abrir cámara y escanear</Text>
          <Text style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>Usa la cámara trasera del teléfono</Text>
        </TouchableOpacity>
      )}

      {!!lastScanned && <Text style={{ color: colors.success, fontSize: 12, marginTop: 10 }}>QR leído: {lastScanned}</Text>}

      <Text style={{ color: colors.text, fontWeight: "800", marginTop: 22 }}>Código de entrada</Text>
      <TextInput value={code} onChangeText={setCode} placeholder="EVQR-..." autoCapitalize="characters" style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginTop: 8, color: colors.text }} />
      <Text style={{ color: colors.text, fontWeight: "700", marginTop: 14 }}>Punto de acceso</Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        {["principal", "lateral", "acreditacion"].map((item) => <TouchableOpacity key={item} onPress={() => setDoor(item)} style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: door === item ? colors.primary : "#fff", borderWidth: 1, borderColor: door === item ? colors.primary : colors.border }}><Text style={{ color: door === item ? "#fff" : colors.text, textAlign: "center", fontSize: 11, fontWeight: "700" }}>{item === "acreditacion" ? "Mesón" : item[0].toUpperCase() + item.slice(1)}</Text></TouchableOpacity>)}
      </View>
      <TouchableOpacity disabled={busy || !code.trim()} onPress={() => accredit()} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginTop: 16, opacity: busy || !code.trim() ? 0.5 : 1 }}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "800" }}>{busy ? "Validando..." : "Confirmar acreditación"}</Text>
      </TouchableOpacity>

      {result && status && (
        <View style={{ backgroundColor: status.bg, borderRadius: 16, padding: 16, marginTop: 18, borderWidth: 1, borderColor: status.color }}>
          <Text style={{ color: status.color, fontSize: 16, fontWeight: "900" }}>{status.title}</Text>
          <Text style={{ color: colors.text, marginTop: 8 }}>{result.mensaje}</Text>
          {!!result.asistente && <Text style={{ color: colors.text, marginTop: 6 }}>Participante: {result.asistente}</Text>}
          {!!result.evento && <Text style={{ color: colors.text, marginTop: 4 }}>Evento: {result.evento}</Text>}
          {!!result.codigo && <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>Código: {result.codigo}</Text>}
          {!!result.acreditada_en && <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{new Date(result.acreditada_en).toLocaleString("es-CL")}</Text>}
        </View>
      )}
      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 16 }}>Todos los intentos, aceptados o rechazados, quedan registrados por el backend en MongoDB.</Text>
    </ScrollView>
  );
}
