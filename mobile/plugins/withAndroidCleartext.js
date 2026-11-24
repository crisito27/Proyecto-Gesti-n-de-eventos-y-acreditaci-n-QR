// Permite conectarse por HTTP a FastAPI dentro de la Wi-Fi del laboratorio.
// Para servidores accesibles públicamente se recomienda HTTPS.
const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withAndroidCleartext(config) {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults?.manifest?.application?.[0];
    if (app?.$) app.$["android:usesCleartextTraffic"] = "true";
    return mod;
  });
};
