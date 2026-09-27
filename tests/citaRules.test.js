const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Módulo de lógica de negocio para Citas Médicas
const CitaBusinessRules = {
  validarFechas(inicio, fin, ahora = new Date()) {
    const s = new Date(inicio);
    const e = new Date(fin);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) throw new Error('Fechas inválidas.');
    if (s >= e) throw new Error('La hora de inicio debe ser anterior a la hora de fin.');
    if (s <= ahora) throw new Error('La cita debe programarse en el futuro.');
    return true;
  },

  haySolapamiento(citasExistentes, nuevoInicio, nuevoFin) {
    const s = new Date(nuevoInicio);
    const e = new Date(nuevoFin);
    return citasExistentes.some(c => {
      if (c.estado === 'Cancelada') return false;
      const cInicio = new Date(c.inicio);
      const cFin = new Date(c.fin);
      return s < cFin && e > cInicio;
    });
  },

  reservarDisponibilidad(disponibilidades, inicio, fin) {
    const s = new Date(inicio);
    const e = new Date(fin);

    const slotIndex = disponibilidades.findIndex(d => 
      d.disponible && new Date(d.inicio) <= s && new Date(d.fin) >= e
    );

    if (slotIndex === -1) return { exito: false, nuevasDisponibilidades: disponibilidades };

    const slot = disponibilidades[slotIndex];
    const copia = [...disponibilidades];
    copia.splice(slotIndex, 1);

    const slotInicio = new Date(slot.inicio);
    const slotFin = new Date(slot.fin);

    if (slotInicio < s) {
      copia.push({ inicio: slotInicio.toISOString(), fin: s.toISOString(), disponible: true });
    }
    if (e < slotFin) {
      copia.push({ inicio: e.toISOString(), fin: slotFin.toISOString(), disponible: true });
    }

    return { exito: true, nuevasDisponibilidades: copia };
  },

  validarCancelacion(citaInicio, estadoActual, fechaCancelacion = new Date()) {
    if (estadoActual === 'Cancelada' || estadoActual === 'Completada') {
      throw new Error('La cita no puede cancelarse en su estado actual.');
    }
    const inicio = new Date(citaInicio);
    const limite24h = new Date(fechaCancelacion.getTime() + 24 * 60 * 60 * 1000);
    if (inicio <= limite24h) {
      throw new Error('La cancelación debe hacerse con al menos 24 horas de anticipación.');
    }
    return true;
  },

  cambiarEstado(estadoActual, nuevoEstado) {
    if (estadoActual === 'Cancelada' && nuevoEstado !== 'Cancelada') {
      throw new Error('No se puede modificar una cita cancelada.');
    }
    return nuevoEstado;
  }
};

describe('Reglas de Negocio de Citas Médicas (CitaService)', () => {

  test('validarFechas: debe rechazar si la hora de inicio es igual o posterior al fin', () => {
    const ahora = new Date('2026-09-20T08:00:00Z');
    assert.throws(
      () => CitaBusinessRules.validarFechas('2026-09-20T11:00:00Z', '2026-09-20T10:00:00Z', ahora),
      { message: 'La hora de inicio debe ser anterior a la hora de fin.' }
    );
  });

  test('validarFechas: debe rechazar si la cita está en el pasado', () => {
    const ahora = new Date('2026-09-20T12:00:00Z');
    assert.throws(
      () => CitaBusinessRules.validarFechas('2026-09-19T10:00:00Z', '2026-09-19T11:00:00Z', ahora),
      { message: 'La cita debe programarse en el futuro.' }
    );
  });

  test('validarFechas: debe aceptar fechas válidas en el futuro', () => {
    const ahora = new Date('2026-09-20T08:00:00Z');
    const valido = CitaBusinessRules.validarFechas('2026-09-22T09:00:00Z', '2026-09-22T10:00:00Z', ahora);
    assert.equal(valido, true);
  });

  test('haySolapamiento: detecta cruce si el médico ya tiene otra cita en el mismo rango', () => {
    const citas = [
      { inicio: '2026-09-25T10:00:00Z', fin: '2026-09-25T11:00:00Z', estado: 'Pendiente' }
    ];
    // Intento de cita de 10:30 a 11:30 (solapada)
    const solapa = CitaBusinessRules.haySolapamiento(citas, '2026-09-25T10:30:00Z', '2026-09-25T11:30:00Z');
    assert.equal(solapa, true);
  });

  test('haySolapamiento: ignora citas que hayan sido canceladas', () => {
    const citas = [
      { inicio: '2026-09-25T10:00:00Z', fin: '2026-09-25T11:00:00Z', estado: 'Cancelada' }
    ];
    // Horario idéntico pero la previa está Cancelada -> permitido
    const solapa = CitaBusinessRules.haySolapamiento(citas, '2026-09-25T10:00:00Z', '2026-09-25T11:00:00Z');
    assert.equal(solapa, false);
  });

  test('reservarDisponibilidad: divide correctamente el bloque horario restante', () => {
    const disponibilidades = [
      { inicio: '2026-09-25T09:00:00Z', fin: '2026-09-25T17:00:00Z', disponible: true }
    ];
    // Reserva de 11:00 a 12:00
    const res = CitaBusinessRules.reservarDisponibilidad(disponibilidades, '2026-09-25T11:00:00Z', '2026-09-25T12:00:00Z');
    assert.equal(res.exito, true);
    // Deben quedar 2 bloques libres: 09:00 a 11:00 y 12:00 a 17:00
    assert.equal(res.nuevasDisponibilidades.length, 2);
    assert.equal(res.nuevasDisponibilidades[0].fin, '2026-09-25T11:00:00.000Z');
    assert.equal(res.nuevasDisponibilidades[1].inicio, '2026-09-25T12:00:00.000Z');
  });

  test('validarCancelacion: rechaza cancelación con menos de 24 horas de anticipación', () => {
    const fechaActual = new Date('2026-09-20T10:00:00Z');
    // Cita en 6 horas
    const citaInicio = '2026-09-20T16:00:00Z';
    assert.throws(
      () => CitaBusinessRules.validarCancelacion(citaInicio, 'Pendiente', fechaActual),
      { message: 'La cancelación debe hacerse con al menos 24 horas de anticipación.' }
    );
  });

  test('validarCancelacion: permite cancelar si se hace con más de 24 horas', () => {
    const fechaActual = new Date('2026-09-20T10:00:00Z');
    // Cita en 4 días
    const citaInicio = '2026-09-24T10:00:00Z';
    const puedeCancelar = CitaBusinessRules.validarCancelacion(citaInicio, 'Pendiente', fechaActual);
    assert.equal(puedeCancelar, true);
  });

  test('validarCancelacion: rechaza cancelar si la cita ya estaba Completada o Cancelada', () => {
    const fechaActual = new Date('2026-09-20T10:00:00Z');
    const citaInicio = '2026-09-25T10:00:00Z';
    assert.throws(
      () => CitaBusinessRules.validarCancelacion(citaInicio, 'Completada', fechaActual),
      { message: 'La cita no puede cancelarse en su estado actual.' }
    );
  });

  test('cambiarEstado: prohíbe reactivar una cita cancelada', () => {
    assert.throws(
      () => CitaBusinessRules.cambiarEstado('Cancelada', 'Confirmada'),
      { message: 'No se puede modificar una cita cancelada.' }
    );
  });
});
