import test from 'node:test';
import assert from 'node:assert/strict';
import { validarInscripcion } from '../src/utils/inscripciones.js';

const evento = { id: 1, aforoBase: 1, aforoMax: 3 };
const participantes = [{ id: 10, email: 'Persona@Ejemplo.cl' }];
const inscripciones = [{ eventoId: 1, participanteId: 10 }];

test('permite una inscripción con cupo y correo nuevo', () => {
  assert.equal(validarInscripcion(evento, participantes, inscripciones, 'nuevo@ejemplo.cl'), null);
});
test('rechaza duplicados ignorando mayúsculas y espacios', () => {
  assert.match(validarInscripcion(evento, participantes, inscripciones, ' persona@ejemplo.cl '), /Ya estás inscrito/);
});
test('permite el mismo correo en otro evento', () => {
  assert.equal(validarInscripcion({ ...evento, id: 2 }, participantes, inscripciones, 'persona@ejemplo.cl'), null);
});
test('rechaza la inscripción cuando las inscripciones completan el aforo', () => {
  assert.match(validarInscripcion({ ...evento, aforoMax: 2 }, participantes, inscripciones, 'nuevo@ejemplo.cl'), /cupos/);
});
test('rechaza un evento inexistente', () => {
  assert.match(validarInscripcion(null, [], [], 'nuevo@ejemplo.cl'), /válido/);
});
