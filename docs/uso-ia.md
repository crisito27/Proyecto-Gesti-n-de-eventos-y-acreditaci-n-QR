# Uso de Inteligencia Artificial — Hito 3

> **Responde al punto 10 del enunciado.**
>
> Antes de entregar: revisa cada fila, corrige lo que no corresponda y completa
> lo marcado como **(completar)**. Este documento es tu respaldo en la defensa,
> y el enunciado advierte que puede haber preguntas sobre el código asistido
> por IA.

## Declaración general

El Hito 3 se desarrolló con apoyo intensivo de IA. El backend FastAPI, la
integración con PostgreSQL y MongoDB, el `docker-compose.yml` y la capa de
servicios del frontend fueron generados con asistencia de **Claude
(Anthropic)**, en una sesión de trabajo conducida por el equipo.

Lo que aportó el equipo: las decisiones de alcance y arquitectura, la
configuración del entorno, la verificación de que todo funciona en la máquina
real, el flujo de Git y la resolución de los problemas que aparecieron durante
la instalación y la ejecución.

No se presenta como trabajo propio el código generado. Se presenta como
trabajo revisado, ejecutado y comprendido por el equipo.

## Herramientas

| Herramienta | Integrante | Etapa |
|---|---|---|
| Claude (Anthropic) | Benjamin Michea | Diagnóstico, backend, persistencia, frontend, documentación |
| *(completar)* | Cristian Pérez | *(completar)* |
| *(completar)* | Ignacio Cornejo | *(completar)* |

---

## Registro de uso

### 1. Diagnóstico del Taller 2 y definición del alcance

**Propósito:** análisis y diseño.

**Prompt representativo:** *"debo continuar con la entrega del taller 3 y estas
son las instrucciones"* — acompañado del enunciado del Hito 3 y del enlace al
repositorio.

**Resultado:** la herramienta clonó el repositorio público, revisó el estado
del Taller 2 y señaló que el caso 3.6 exige seis funcionalidades de las cuales
tres ya estaban implementadas en React (inscripciones, control de cupos,
estados de asistente) y tres faltaban (organizadores, publicación de eventos,
pagos con comprobante). Propuso además usar el log de acreditación QR como la
colección de MongoDB, por corresponder a "registros de acceso y participación".

**Validación humana:** se contrastó la propuesta con el punto 3.6 del enunciado
para confirmar que cubría las seis funcionalidades obligatorias.

**Aprendizaje:** la elección de la base NoSQL no es una decisión técnica
aislada: tiene que responder a una característica real de los datos. En este
caso, que los registros de acceso son hechos históricos de sólo inserción, con
forma variable según el resultado.

---

### 2. Instalación de Docker y WSL2

**Propósito:** configuración del entorno.

**Prompt representativo:** *"no tengo Docker instalado, ¿qué deberia hacer?"*

**Resultado:** indicaciones para instalar WSL2 con `wsl --install`, reiniciar,
instalar Docker Desktop y verificar con `docker ps`.

**Validación humana:** se ejecutaron los pasos y se comprobó que el motor
quedara en "Engine running". Apareció un error intermedio: `docker --version`
respondía pero `docker ps` fallaba con *"cannot connect to the docker API at
npipe:////./pipe/docker_engine"*. Se resolvió al entender que el cliente de
línea de comandos y el motor son dos cosas distintas, y que el motor sólo
arranca al abrir la aplicación Docker Desktop.

**Aprendizaje:** la diferencia entre el cliente Docker y el demonio; y que WSL2
es un requisito previo en Windows, no parte del instalador.

---

### 3. Backend FastAPI con separación de responsabilidades

**Propósito:** generación de código.

**Prompt representativo:** solicitud de un backend FastAPI para el caso 3.6 con
PostgreSQL y MongoDB, separando controladores, servicios, esquemas, modelos y
configuración, con reglas de negocio demostrables y Swagger.

**Resultado:** backend organizado en `core/`, `models/`, `schemas/`,
`services/` y `routers/`, con 29 endpoints, errores de dominio traducidos a
HTTP por un manejador central, y 15 pruebas automatizadas que la herramienta
ejecutó contra PostgreSQL real antes de entregarlo.

**Validación humana:** se levantó con Docker Compose en la máquina del equipo,
se cargaron los datos de prueba y se recorrió el flujo completo desde Swagger:
crear evento, publicar, inscribir, pagar, acreditar y acreditar de nuevo.
*(completar: qué más revisaron, qué ajustaron)*

**Aprendizaje:** por qué los servicios no deben conocer HTTP. Al lanzar
excepciones de dominio en vez de `HTTPException`, la misma lógica sirve para la
API web y para cualquier otro cliente, y todos los errores salen con la misma
forma sin repetir código en cada endpoint.

---

### 4. Corrección de un error en la conversión a DTO

**Propósito:** depuración.

**Resultado:** al ejecutar las pruebas, ocho fallaron con
`ValidationError: categoria — Input should be a valid string`. La causa: el DTO
`EventoSalida` define `categoria` como texto, pero `model_validate` sobre el
objeto de SQLAlchemy leía la relación completa en vez del nombre. Se corrigió
copiando sólo las columnas de la tabla y agregando después los campos
derivados.

**Validación humana:** se volvieron a ejecutar las 15 pruebas, todas en verde.

**Aprendizaje:** `from_attributes` de Pydantic lee los atributos del objeto sin
distinguir entre columnas y relaciones. Cuando un campo del DTO se llama igual
que una relación del modelo pero tiene otro tipo, hay que construir el
diccionario explícitamente.

---

### 5. Justificación del uso de MongoDB

**Propósito:** diseño y documentación.

**Resultado:** cuatro argumentos sobre por qué los registros de acceso no son
una duplicación de PostgreSQL: son hechos y no estado, son de sólo inserción,
crecen a otra escala y su forma varía según el resultado del intento. Se
implementó además un resumen por evento con el pipeline de agregación
(`$match` + `$group`) en lugar de contar en Python.

**Validación humana:** se verificó en la aplicación que los tres tipos de
intento (acreditado, duplicado, código inválido) quedan registrados con
estructura distinta. *(completar)*

**Aprendizaje:** el enunciado advierte que no basta con conectar MongoDB. La
prueba de que su uso está justificado es poder señalar una característica de
los datos que una tabla relacional modelaría peor.

---

### 6. Migración del frontend a la API

**Propósito:** generación de código y refactorización.

**Resultado:** capa de servicios HTTP (`apiCliente.js` y un módulo por
recurso), hook `useRecurso` para los estados de carga y error, y componentes
nuevos para administración de eventos, pago con comprobante y bitácora de
accesos. Se eliminaron `data/eventos.json`, `services/climaApi.js` y
`utils/inscripciones.js`.

**Validación humana:** se recorrió el flujo completo en el navegador con el
backend levantado. *(completar: qué revisaron, qué ajustaron)*

**Aprendizaje:** tres decisiones del Taller 2 eran incorrectas y se entendió
por qué: generar el código de acreditación con `Math.random()` en el navegador
(el código es la credencial de acceso y debe emitirlo el servidor); validar el
aforo sólo en el cliente (el navegador es manipulable y el aforo cambia
mientras el formulario está abierto); y guardar el estado completo en
`localStorage` en lugar de una referencia.

---

## Qué puede explicar el equipo

*(Completar honestamente antes de la entrega. Si hay partes que no se dominan,
es mejor estudiarlas que declararlas.)*

| Área | Quién la explica |
|---|---|
| Modelo relacional y restricciones | *(completar)* |
| Reglas de negocio y códigos HTTP | *(completar)* |
| Justificación de MongoDB y la agregación | *(completar)* |
| Capa de servicios del frontend y estados | *(completar)* |
| Docker Compose y variables de entorno | *(completar)* |
| Integración de la API pública | *(completar)* |
