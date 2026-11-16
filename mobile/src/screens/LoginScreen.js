import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../theme/colors";

const inputStyle = {
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 10,
  padding: 13,
  marginTop: 8,
  color: colors.text,
};

export default function LoginScreen({ onLogin, loading }) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");

  const submit = () => {
    if (!email.trim() || !clave) {
      Alert.alert("Datos incompletos", "Ingresa tu correo y contraseña.");
      return;
    }

    onLogin(email.trim(), clave);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 18,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 23,
              fontWeight: "800",
            }}
          >
            Acceso de organizador
          </Text>

          <Text
            style={{
              color: colors.muted,
              marginTop: 7,
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            Inicia sesión para acceder al panel, escanear entradas y consultar
            la bitácora.
          </Text>

          <Text style={{ color: colors.text, fontWeight: "700" }}>
            Correo electrónico
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="organizador@correo.cl"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={inputStyle}
          />

          <Text
            style={{
              color: colors.text,
              fontWeight: "700",
              marginTop: 16,
            }}
          >
            Contraseña
          </Text>

          <TextInput
            value={clave}
            onChangeText={setClave}
            placeholder="Contraseña"
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={submit}
            style={inputStyle}
          />

          <TouchableOpacity
            disabled={loading}
            onPress={submit}
            style={{
              backgroundColor: colors.primary,
              padding: 15,
              borderRadius: 12,
              marginTop: 22,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}