# Acredita QR Mobile

Aplicación móvil independiente para Acredita QR. Está pensada para Android y iOS con Expo + React Native y consume la API FastAPI que ya existe. No modifica `taller2-react/` ni `backend/`.

## 1. Qué incluye

- Panel de indicadores desde `GET /api/indicadores`.
- Listado de eventos desde `GET /api/eventos`.
- Inscripción pública desde `POST /api/inscripciones/publica` y confirmación mediante el pago simulado existente `POST /api/pagos`.
- Escáner QR con cámara y acreditación desde `POST /api/acreditaciones`.
- Ingreso manual de código como alternativa al escáner.
- Bitácora desde `GET /api/registros-acceso`.
- Actualizaciones WebSocket desde `/ws` y refresco de datos al recibir cambios.
- Interfaz móvil con navegación inferior.

## 2. Crear el proyecto Expo

Desde la raíz del repositorio, ejecuta:

```bash
npx create-expo-app@latest mobile --template blank
```

Si ya existe una carpeta `mobile`, no la sobrescribas: crea el proyecto temporalmente en `mobile-temp` y copia su contenido base a `mobile`.

Después, copia/combina el contenido de esta carpeta `mobile/` dentro de la carpeta `mobile/` creada por Expo. Reemplaza `App.js` y `app.json`; agrega la carpeta `src/`.

Instala las dependencias compatibles con la versión de Expo instalada:

```bash
cd mobile
npx expo install expo-camera react-native-svg
npm install react-native-qrcode-svg
```

No instales versiones manuales de React Native: `expo install` selecciona las compatibles con el SDK de Expo generado.

## 3. Configurar la URL del backend

Crea `mobile/.env` (no se debe subir al repositorio) y define:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

Cambia `192.168.1.100` por la IPv4 LAN del computador donde corre Docker/backend.

Direcciones habituales:
- Teléfono físico: `http://IP-LAN-DE-TU-PC:8000/api` (ambos dispositivos en la misma Wi-Fi).
- Emulador Android: `http://10.0.2.2:8000/api`.
- Simulador iOS: `http://localhost:8000/api`.
- Producción: usa una URL HTTPS pública; no uses `localhost`.

El WebSocket se calcula automáticamente reemplazando `/api` por `/ws`. Si tu backend está publicado en otra ruta, define también `EXPO_PUBLIC_WS_URL`, por ejemplo:

```env
EXPO_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws
```

## 4. Levantar backend y app

Desde la raíz del repositorio:

```bash
docker compose up --build
```

En otra terminal:

```bash
cd mobile
npx expo start
```

Escanea el QR de Expo Go con el teléfono. Asegúrate de que el firewall permita conexiones al puerto 8000.

## 5. Consideraciones del backend actual

- La API actual no implementa autenticación ni roles protegidos. Por eso esta app no inventa un login: utiliza los endpoints existentes. Antes de publicar la app en producción, agrega autenticación real y autorización para las operaciones de organizador/acreditación.
- El QR generado por la versión web contiene el código de inscripción. La app móvil espera que el QR contenga directamente ese código (por ejemplo `EVQR-...`). Si el formato del QR cambia a una URL o JSON, adapta `normalizarCodigoQR()` en `src/screens/ScannerScreen.js`.
- El escaneo requiere permiso de cámara. Si el permiso se deniega, se puede ingresar el código manualmente.
- En el teléfono físico, `localhost` apunta al teléfono, no al computador. Usa la IP LAN del computador.
- Para usar la app fuera de la red local, publica el backend con HTTPS/WSS y configura CORS/red/firewall correctamente.

## 6. Estructura

```text
mobile/
├── App.js
├── app.json
└── src/
    ├── components/
    │   ├── EventCard.js
    │   ├── LoadingView.js
    │   └── StatCard.js
    ├── screens/
    │   ├── DashboardScreen.js
    │   ├── EventsScreen.js
    │   ├── LogsScreen.js
    │   └── ScannerScreen.js
    ├── services/
    │   ├── api.js
    │   └── realtime.js
    └── theme/
        └── colors.js
```

## 7. Pruebas mínimas antes de darla por terminada

1. Abrir el panel y comprobar que carga los indicadores.
2. Abrir Eventos y comprobar que aparecen los eventos publicados.
3. Escanear una entrada pagada y comprobar resultado `acreditado`.
4. Escanear el mismo QR otra vez y comprobar resultado `duplicado`.
5. Probar un código inventado y comprobar `codigo_invalido`.
6. Comprobar que los intentos aparecen en la bitácora.
7. Abrir la app y la web simultáneamente y comprobar que los cambios se reflejan por WebSocket.
8. Probar en teléfono físico, no solamente en emulador.
