# Guía breve de presentación y defensa técnica

## Orden sugerido de la exposición

1. **Problema:** inscripción y acreditación manual en eventos.
2. **Usuarios:** asistente y organizador.
3. **Solución:** catálogo, inscripción, QR, check-in y dashboard.
4. **Diseño:** mostrar `docs/diseno-interfaz.md` y luego la interfaz real.
5. **React:** explicar componentes, props, estados y renderizado condicional.
6. **Datos:** JSON local + estado React + localStorage.
7. **API:** Open-Meteo y sus estados de carga/error.
8. **Demo:** ejecutar el flujo completo.
9. **Código:** abrir 2 o 3 archivos clave y justificar decisiones.

## Demo recomendada

1. Abrir **Eventos**.
2. Usar búsqueda y filtros.
3. Elegir un evento con cupos; para demostrar la API, usar uno marcado como
   **Al aire libre**.
4. Intentar enviar datos inválidos y mostrar las validaciones.
5. Completar datos válidos y confirmar.
6. Mostrar **Mi entrada** con QR y código.
7. Copiar el código.
8. Ir a **Organizador → Acreditación**, buscar el código y confirmar asistencia.
9. Volver a buscar el mismo código para mostrar que no permite acreditar dos veces.
10. Abrir **Dashboard** y mostrar el cambio de estado/aforo.
11. Reducir el ancho del navegador para demostrar responsive.

## Preguntas probables y respuesta esperada

### ¿Por qué dividieron la aplicación en componentes?
Para separar responsabilidades, reutilizar interfaz y evitar concentrar toda la
lógica y presentación en `App.jsx`.

### ¿Qué información se pasa por props?
Por ejemplo, `EventoCard` recibe el evento, los inscritos y la función para
abrir la inscripción; `Navbar` recibe la vista activa y la función que la cambia.

### ¿Qué estado vive en App.jsx?
Participantes, inscripciones, inscripción actual, vista activa y evento cuyo
modal está abierto, porque esos datos afectan a más de una pantalla.

### ¿Qué estado es local?
Filtros de `Eventos`, datos/errores del formulario, código y resultado de
`CheckIn`, y carga/error/datos de `ClimaEvento`.

### ¿Por qué se usa useEffect?
Para sincronizar datos externos: persistir el estado en `localStorage` y
realizar la consulta HTTP del clima cuando cambian coordenadas o fecha.

### ¿Qué provoca un nuevo render?
Una actualización de estado mediante funciones como `setInscripciones`,
`setVista`, `setFiltros` o `setClima`.

### ¿Qué pasa si falla la API?
Se captura el error, se muestra un mensaje y el formulario sigue funcionando.
La API complementa la inscripción, no bloquea la función principal.

### ¿Por qué no hay backend?
Porque el enunciado del taller indica explícitamente que el foco es frontend.
Los datos iniciales se simulan con JSON y los cambios se mantienen con estado y
`localStorage`.

### ¿Cuál es la diferencia entre JSON local y fetch?
El JSON local forma parte del proyecto y sirve como fuente inicial; `fetch`
consulta información externa en tiempo de ejecución.

### ¿Cómo se calcula el aforo?
Se toma `aforoBase` del evento y se suman las inscripciones registradas en la
aplicación. No se guarda un contador duplicado que pueda quedar inconsistente.

### ¿Qué parte fue apoyada por IA?
Responder únicamente con lo documentado en `docs/uso-ia.md` y explicar qué
fue revisado o modificado por el equipo.

## Archivos recomendados para abrir durante la defensa

- `src/App.jsx`: estado compartido, localStorage y acciones.
- `src/pages/Eventos.jsx`: estado local y filtrado.
- `src/components/ModalInscripcion.jsx`: formulario controlado y validación.
- `src/components/ClimaEvento.jsx`: useEffect y estados de API.
- `src/services/climaApi.js`: fetch y transformación de respuesta.
- `src/components/CheckIn.jsx`: lógica de acreditación.
