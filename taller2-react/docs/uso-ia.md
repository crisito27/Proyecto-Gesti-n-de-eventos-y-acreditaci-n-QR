# Uso de Inteligencia Artificial

Este documento responde al reporte obligatorio de uso de IA del Taller
Evaluado 2. Debe describir usos reales y cada integrante debe poder explicar
las partes del proyecto asociadas.

## Herramientas utilizadas

| Herramienta | Integrante / contexto | Etapa del proyecto |
|---|---|---|
| Claude (Anthropic) | Benjamin Michea | Migración a React, integración de API y revisión inicial |
| ChatGPT (OpenAI) | Cristian Perez, revisión final del repositorio | Auditoría contra la pauta, documentación, accesibilidad y preparación de entrega |

## Registro de uso

### 1. Revisión del estado del repositorio

- **Propósito:** diagnosticar el repositorio de la actividad anterior antes de
  continuar con React.
- **Consulta representativa:** se entregó el enlace del repositorio y las
  instrucciones del taller para identificar qué faltaba.
- **Resultado:** se detectó la necesidad de organizar el trabajo con
  `develop`, ramas `feature/`, Pull Requests e integrar una API pública.
- **Modificación humana:** el equipo decidió adoptar Git Flow y distribuir el
  desarrollo por funcionalidades.
- **Aprendizaje:** el historial de Git es parte de la evidencia del proceso y no
  sólo un respaldo del código.

### 2. Configuración del entorno React

- **Propósito:** resolver problemas al instalar Node.js y crear el proyecto Vite.
- **Consulta representativa:** *"npm no se reconoce como nombre de un cmdlet"*.
- **Resultado:** se indicó cómo instalar/verificar Node.js y npm y cómo ejecutar
  el proyecto.
- **Modificación humana:** instalación y verificación del entorno local.
- **Aprendizaje:** npm depende de Node.js y una terminal abierta puede requerir
  reinicio para reconocer cambios del PATH.

### 3. Estructura de componentes React

- **Propósito:** traducir la aplicación de manipulación directa del DOM a una
  arquitectura de componentes.
- **Consulta representativa:** se solicitó organizar listado, filtros,
  inscripción, entrada, check-in y dashboard en React.
- **Resultado:** separación en `components/`, `pages/`, `services/`,
  `data/` y `utils/`, con estado compartido en `App.jsx`.
- **Modificación humana requerida para cerrar este registro:** antes de entregar,
  el equipo debe revisar esta arquitectura y dejar aquí una frase concreta con
  cualquier ajuste que efectivamente haya realizado.
- **Aprendizaje:** el estado compartido se eleva al ancestro común; el estado
  que sólo necesita un componente permanece local.

### 4. Modelo de datos y aforo

- **Propósito:** evitar inconsistencias al contar inscritos.
- **Resultado:** se usa `aforoBase` más el conteo de inscripciones nuevas en
  lugar de mantener dos contadores independientes.
- **Modificación humana requerida para cerrar este registro:** confirmar en la
  demo que listado y dashboard muestran cifras coherentes después de una
  inscripción.
- **Aprendizaje:** no conviene guardar en estado un dato que puede derivarse de
  otra fuente de verdad ya existente.

### 5. Integración de la API pública

- **Propósito:** incorporar Open-Meteo con estados de carga, error y datos.
- **Resultado:** `climaApi.js` concentra la consulta HTTP y
  `ClimaEvento.jsx` administra el ciclo de carga/error/renderizado.
- **Modificación humana requerida para cerrar este registro:** el equipo debe
  probar al menos un evento exterior y confirmar que el mensaje de error no
  bloquea la inscripción.
- **Aprendizaje:** `fetch` no trata automáticamente los estados HTTP 4xx/5xx
  como excepciones; por eso se comprueba `response.ok`.

### 6. Auditoría final con ChatGPT

- **Propósito:** comparar el repositorio con los requisitos del Taller Evaluado
  2 y mejorar los elementos que podían corregirse sin inventar evidencias.
- **Consulta representativa:** *"sube todo lo que se pueda mejorar al
  repositorio; lo que no puedas hacer como las evidencias dime explícitamente
  qué son y cómo realizarlas"*.
- **Resultado:** se agregaron documentación de diseño y wireframes, guía de
  defensa, checklist de evidencias pendientes, mejoras de accesibilidad del
  formulario, uso del clima sólo donde es pertinente y configuración de
  despliegue de la aplicación React en GitHub Pages.
- **Modificación humana requerida:** Cristian, Ignacio y Benjamin deben revisar
  estos cambios, probar el flujo y conservar sólo aquello que puedan explicar.
- **Aprendizaje a validar por el equipo:** distinguir entre una mejora que puede
  generarse técnicamente y una evidencia histórica/personal que no debe
  inventarse.

## Validación antes de entregar

El equipo debe reemplazar las frases “modificación humana requerida” por una
descripción breve de lo que **realmente hizo** al revisar/probar cada punto.
No se debe declarar una revisión que no ocurrió.

## Declaración

La IA se utilizó como apoyo para diagnóstico, generación y revisión. La
responsabilidad de probar, comprender y defender el código corresponde a los
integrantes del equipo.

## 7. Cierre técnico solicitado por Ignacio

- Herramienta: ChatGPT/Codex (OpenAI).
- Propósito: implementar pendientes de la comparación con la pauta.
- Consulta representativa: “¿puedes hacerlo todo tú, lo que falta?”.
- Resultado: detalle de evento, validación de aforo y duplicados al confirmar,
  atribución y condiciones de API, documentación y verificaciones técnicas.
- Verificación realizada por la herramienta: consultar `verificacion-entrega.md`.
- Modificación humana: pendiente de revisión real por el equipo; no se atribuye
  a Ignacio la autoría manual ni la comprobación personal de estos cambios.
- Aprendizaje a comprobar en la defensa: explicar por qué validar en la acción
  además de deshabilitar un botón, cómo se normaliza el correo y cómo se
  comunican el detalle y la inscripción mediante props.

Los registros anteriores que indican revisión humana pendiente siguen abiertos
hasta que sus responsables realicen esa revisión. La herramienta no puede
certificar aprendizajes personales ni reconstruir pruebas históricas de diseño.

## Material de exposición preparado con IA

ChatGPT/Codex preparó el mapa actualizado, wireframes editables y una
presentación con notas a solicitud de Ignacio. Estos materiales describen la
versión actual y no certifican diseño previo ni ensayo personal. El equipo
debe revisar el contenido y adaptar la distribución propuesta antes de exponer.
