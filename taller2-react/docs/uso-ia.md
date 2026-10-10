# Uso de Inteligencia Artificial

> Este documento responde al punto 13 del Taller Evaluado 2.
> **Revisa y corrige cada fila antes de entregar:** debe describir lo que
> realmente ocurrió, y cada integrante debe poder explicar el código asociado.

## Herramientas utilizadas

| Herramienta | Integrante | Etapa del proyecto |
|---|---|---|
| Claude (Anthropic) | Benjamin Michea | Migración a React, integración de la API, revisión del repositorio |

## Registro de uso

### 1. Revisión del estado del repositorio

- **Propósito:** diagnóstico del repositorio de la Actividad Evaluada 1 antes de
  comenzar el Taller 2.
- **Consulta representativa:** *"debo seguir avanzando el taller, ahora con
  estas instrucciones, ¿cómo hago para que puedas ver el avance?"* — se entregó
  el enlace del repositorio y el documento del taller.
- **Resultado:** la herramienta clonó el repositorio público y reportó que el
  historial tenía tres commits de un solo autor, que no existían las ramas
  `develop` ni `feature/`, que faltaba `.gitignore` y que no había integración
  con ninguna API pública.
- **Modificación humana:** se decidió crear la rama `develop`, trabajar con
  ramas `feature/` y distribuir los commits entre los integrantes.
- **Aprendizaje:** el historial de un repositorio es evidencia evaluable, no
  sólo un respaldo del código.

### 2. Configuración del entorno React

- **Propósito:** resolver errores al instalar Node.js y crear el proyecto Vite.
- **Consulta representativa:** *"npm no se reconoce como nombre de un cmdlet"*.
- **Resultado:** se diagnosticó que Node.js no estaba instalado y se indicó la
  instalación mediante `winget`, además de la necesidad de reabrir la terminal
  para que el PATH se actualizara.
- **Modificación humana:** ejecución de los comandos y verificación con
  `node -v` y `npm -v`.
- **Aprendizaje:** el PATH no se refresca en una terminal ya abierta; los
  comandos de npm consumen el texto pegado a continuación como respuesta a sus
  preguntas, por lo que deben ejecutarse de a uno.

### 3. Estructura de componentes React

- **Propósito:** traducir la aplicación de manipulación directa del DOM a una
  arquitectura de componentes.
- **Consulta representativa:** se solicitó una estructura de componentes que
  cubriera listado, filtros, inscripción, entrada, check-in y dashboard,
  reutilizando el CSS ya escrito en la Actividad 1.
- **Resultado:** propuesta de separación entre `components/`, `pages/`,
  `services/`, `data/` y `utils/`, con el estado compartido en `App.jsx`.
- **Modificación humana:** *(completar: qué revisaron, qué renombraron, qué
  ajustaron y qué descartaron)*.
- **Aprendizaje:** la diferencia entre estado compartido, que debe subir al
  componente padre, y estado local, que se queda donde se usa.

### 4. Corrección del modelo de datos

- **Propósito:** revisar cómo se contaban los inscritos.
- **Resultado:** se identificó que en la Actividad 1 el campo `aforoActual`
  guardaba un número que también podía deducirse del array `inscripciones`, de
  modo que ambas fuentes podían contradecirse. Se reemplazó por `aforoBase` más
  el conteo de inscripciones registradas.
- **Modificación humana:** *(completar)*.
- **Aprendizaje:** en React no se guarda en estado aquello que puede calcularse
  a partir del estado existente.

### 5. Integración de la API pública

- **Propósito:** incorporar Open-Meteo con sus estados de carga y error.
- **Resultado:** `climaApi.js` con la función de consulta y `ClimaEvento.jsx`
  con `useEffect`, manejo de carga, error y ausencia de datos.
- **Modificación humana:** *(completar: verificación del endpoint en el
  navegador, ajuste de las fechas de los eventos al rango de pronóstico)*.
- **Aprendizaje:** `fetch` sólo rechaza ante errores de red, por lo que un 404 o
  un 400 llegan como respuesta exitosa y deben verificarse con `response.ok`.

## Declaración

El código entregado fue revisado, comprendido y ajustado por el equipo. Cada
integrante puede explicar las partes del proyecto en las que trabajó, incluida
la lógica generada con apoyo de herramientas de IA.
