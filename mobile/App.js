import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DashboardScreen from "./src/screens/DashboardScreen";
import EventsScreen from "./src/screens/EventsScreen";
import MyTicketsScreen from "./src/screens/MyTicketsScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import LogsScreen from "./src/screens/LogsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { cargarUrlApi, guardarUrlApi, obtenerUrlApi } from "./src/services/serverConfig";
import { colors } from "./src/theme/colors";
import { conectarRealtime } from "./src/services/realtime";
import {
  apiFunciones,
  eliminarToken,
  guardarToken,
  obtenerToken,
} from "./src/services/api";

const TABS = [
  { key: "inicio", label: "Inicio", icon: "⌂" },
  { key: "eventos", label: "Eventos", icon: "▦" },
  { key: "entradas", label: "Entradas", icon: "▢" },
  { key: "escanear", label: "Escanear", icon: "▣" },
  { key: "registros", label: "Bitácora", icon: "≡" },
  { key: "ajustes", label: "Ajustes", icon: "⚙" },
];

export default function App() {
  const [tab, setTab] = useState("eventos");
  const [refreshKey, setRefreshKey] = useState(0);
  const [usuario, setUsuario] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(obtenerUrlApi());
  const [configLoading, setConfigLoading] = useState(true);

  const refrescar = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  useEffect(() => {
    let activo = true;
    cargarUrlApi()
      .then((guardada) => {
        if (!activo) return;
        setApiUrl(guardada);
        if (!guardada) setTab("ajustes");
      })
      .catch(() => {
        if (activo) setTab("ajustes");
      })
      .finally(() => {
        if (activo) setConfigLoading(false);
      });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (configLoading) return;
    if (!apiUrl) {
      setUsuario(null);
      setAuthLoading(false);
      return;
    }
    let activo = true;
    setAuthLoading(true);
    const restaurarSesion = async () => {
      try {
        const token = await obtenerToken();
        if (!token) return;
        const actual = await apiFunciones.yo();
        if (actual?.rol !== "organizador") {
          await eliminarToken();
          return;
        }
        if (activo) {
          setUsuario(actual);
          setTab("inicio");
        }
      } catch (_) {
        await eliminarToken();
      } finally {
        if (activo) setAuthLoading(false);
      }
    };
    restaurarSesion();
    return () => { activo = false; };
  }, [configLoading, apiUrl]);

  useEffect(() => {
    if (configLoading || !apiUrl) return;
    return conectarRealtime(refrescar, apiUrl);
  }, [refrescar, apiUrl, configLoading]);

  const configurarServidor = async (direccion) => {
    const nueva = await guardarUrlApi(direccion);
    if (nueva !== apiUrl) {
      await eliminarToken();
      setUsuario(null);
      setAuthLoading(false);
      setApiUrl(nueva);
      setTab("eventos");
      refrescar();
    }
    return nueva;
  };

  const iniciarSesion = async (email, clave) => {
    setLoginLoading(true);

    try {
      const sesion = await apiFunciones.login(email, clave);

      if (!sesion?.access_token || !sesion?.usuario) {
        throw new Error("El servidor no devolvió una sesión válida.");
      }

      if (sesion.usuario.rol !== "organizador") {
        throw new Error(
          "Esta cuenta no tiene permisos de organizador."
        );
      }

      await guardarToken(sesion.access_token);
      setUsuario(sesion.usuario);
      setTab("inicio");
      refrescar();
    } catch (error) {
      const mensaje =
        error?.message || "No se pudo iniciar sesión.";

      const { Alert } = require("react-native");
      Alert.alert("No se pudo iniciar sesión", mensaje);
    } finally {
      setLoginLoading(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await eliminarToken();
    } finally {
      setUsuario(null);
      setTab("eventos");
      setRefreshKey((n) => n + 1);
    }
  };

  const renderScreen = () => {
    if (configLoading) {
      return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ marginTop: 10, color: colors.muted }}>Cargando configuración...</Text></View>;
    }

    if (tab === "ajustes" || !apiUrl) {
      return <SettingsScreen apiUrl={apiUrl} onSave={configurarServidor} />;
    }

    if (tab === "eventos") {
      return (
        <EventsScreen
          refreshKey={refreshKey}
          onChanged={refrescar}
        />
      );
    }

    // "Mis entradas" es pública igual que el catálogo: el asistente no
    // tiene cuenta, se identifica por el código que guarda su dispositivo.
    if (tab === "entradas") {
      return (
        <MyTicketsScreen
          refreshKey={refreshKey}
          onNavigate={setTab}
        />
      );
    }

    if (authLoading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>
            Comprobando sesión...
          </Text>
        </View>
      );
    }

    if (!usuario) {
      return (
        <LoginScreen
          onLogin={iniciarSesion}
          loading={loginLoading}
        />
      );
    }

    if (tab === "escanear") {
      return <ScannerScreen onAccredited={refrescar} />;
    }

    if (tab === "registros") {
      return <LogsScreen refreshKey={refreshKey} />;
    }

    return (
      <DashboardScreen
        refreshKey={refreshKey}
        onNavigate={setTab}
      />
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.navy}
      />

      <View
        style={{
          backgroundColor: colors.navy,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#93c5fd",
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 1.6,
              }}
            >
              GESTIÓN DE EVENTOS
            </Text>

            <Text
              style={{
                color: "#ffffff",
                fontSize: 25,
                fontWeight: "800",
                marginTop: 3,
              }}
            >
              Acredita QR
            </Text>

            {usuario ? (
              <Text
                numberOfLines={1}
                style={{
                  color: "#cbd5e1",
                  fontSize: 11,
                  marginTop: 5,
                }}
              >
                Sesión: {usuario.nombre || usuario.email}
              </Text>
            ) : (
              <Text
                style={{
                  color: "#cbd5e1",
                  fontSize: 11,
                  marginTop: 5,
                }}
              >
                {apiUrl ? "Acceso público a eventos" : "Servidor sin configurar"}
              </Text>
            )}
          </View>

          {usuario ? (
            <TouchableOpacity
              onPress={cerrarSesion}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: "#64748b",
                marginLeft: 10,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                Salir
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {TABS.map((item) => {
          const active = tab === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setTab(item.key)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 5,
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={{
                  fontSize: 21,
                  color: active ? colors.primary : colors.muted,
                }}
              >
                {item.icon}
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: active ? "800" : "600",
                  color: active ? colors.primary : colors.muted,
                  marginTop: 2,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}