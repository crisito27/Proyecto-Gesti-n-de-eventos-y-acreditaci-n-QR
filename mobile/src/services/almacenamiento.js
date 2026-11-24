/* =========================================================
   almacenamiento.js — referencias locales a las inscripciones
   hechas desde este dispositivo.

   Por qué existe
   --------------
   El asistente no tiene cuenta: se identifica por su correo al
   inscribirse. Para que pueda volver a ver sus entradas, el
   dispositivo necesita recordar cuáles hizo.

   Lo que se guarda aquí son SÓLO referencias: el id y el código
   de cada inscripción. El estado real —si está pagada, si ya fue
   acreditada, qué comprobante tiene— siempre se consulta a la API.
   Así, si el organizador acredita la entrada desde su panel, al
   abrir esta pantalla el estado aparece actualizado.

   Es el mismo criterio que usa la aplicación web, que guarda en
   localStorage el id de la última inscripción y no los datos.
   ========================================================= */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const CLAVE = "acredita_qr_mis_inscripciones";

// SecureStore limita el tamaño de cada valor, así que se conservan
// sólo las más recientes.
const MAXIMO = 20;

async function leerCrudo() {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(CLAVE)
        : null;
    }

    return await SecureStore.getItemAsync(CLAVE);
  } catch (_) {
    // Navegador en modo privado, almacenamiento bloqueado, etc.
    return null;
  }
}

async function escribirCrudo(texto) {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CLAVE, texto);
      }
      return;
    }

    await SecureStore.setItemAsync(CLAVE, texto);
  } catch (_) {
    // Si el almacenamiento falla, la aplicación sigue funcionando:
    // sólo se pierde el historial local al cerrar.
  }
}

/** Devuelve [{ id, codigo, evento, fecha }] de más reciente a más antigua. */
export async function listarMisInscripciones() {
  const crudo = await leerCrudo();

  if (!crudo) return [];

  try {
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? datos : [];
  } catch (_) {
    return [];
  }
}

/** Agrega una inscripción al historial local, sin duplicar. */
export async function guardarInscripcion({ id, codigo, evento, fecha }) {
  const actuales = await listarMisInscripciones();
  const sinDuplicado = actuales.filter((item) => item.id !== id);

  const nuevas = [
    { id, codigo, evento: evento || "", fecha: fecha || "" },
    ...sinDuplicado,
  ].slice(0, MAXIMO);

  await escribirCrudo(JSON.stringify(nuevas));
  return nuevas;
}

/** Quita una inscripción del historial local (no la cancela en el backend). */
export async function olvidarInscripcion(id) {
  const actuales = await listarMisInscripciones();
  const nuevas = actuales.filter((item) => item.id !== id);
  await escribirCrudo(JSON.stringify(nuevas));
  return nuevas;
}
