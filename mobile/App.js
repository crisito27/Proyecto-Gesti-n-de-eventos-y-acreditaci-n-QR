import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DashboardScreen from "./src/screens/DashboardScreen";
import EventsScreen from "./src/screens/EventsScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import LogsScreen from "./src/screens/LogsScreen";
import { colors } from "./src/theme/colors";
import { conectarRealtime } from "./src/services/realtime";

const TABS = [
  { key: "inicio", label: "Inicio", icon: "⌂" },
  { key: "eventos", label: "Eventos", icon: "▦" },
  { key: "escanear", label: "Escanear", icon: "▣" },
  { key: "registros", label: "Bitácora", icon: "≡" },
];

export default function App() {
  const [tab, setTab] = useState("inicio");
  const [refreshKey, setRefreshKey] = useState(0);

  const refrescar = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  useEffect(() => {
    const desconectar = conectarRealtime(refrescar);
    return desconectar;
  }, [refrescar]);

  const renderScreen = () => {
    if (tab === "eventos") {
      return (
        <EventsScreen
          refreshKey={refreshKey}
          onChanged={refrescar}
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
