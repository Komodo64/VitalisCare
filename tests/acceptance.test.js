/**
 * SUITE DE PRUEBAS DE ACEPTACIÓN (ACCEPTANCE TESTING / UAT) - VITALIS CARE
 * Enfoque: Historias de Usuario (User Stories) y Criterios de Aceptación (BDD)
 * Estructura: Dado que (Given) -> Cuando (When) -> Entonces (Then)
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Simulación completa del dominio de aceptación
class SistemaCitasAceptacion {
  constructor() {
    this.reiniciar();
  }

  reiniciar() {
    this.medicos = [
      { id: "med-1", nombre: "Dra. Ana García", especialidad: "Cardiología" },
      { id: "med-2", nombre: "Dr. Luis Pérez", especialidad: "Dermatología" }
    ];
    this.pacientes = [
      { id: "pac-1", nombre: "María López", email: "maria@citas.local" },
      { id: "pac-2", nombre: "Carlos Ruiz", email: "carlos@citas.local" }
    ];
    this.citas = [];
  }

  agendarCita({ medicoId, pacienteId, inicio, fin, motivo }) {
    const s = new Date(inicio);
    const e = new Date(fin);
    if (s >= e) throw new Error('La hora de inicio debe ser anterior al fin.');
    if (s <= new Date()) throw new Error('La cita debe ser en el futuro.');

    // Validar solapamiento
    const solapada = this.citas.some(c => 
      c.medicoId === medicoId &&
      c.estado !== 'Cancelada' &&
      s < new Date(c.fin) && e > new Date(c.inicio)
    );
    if (solapada) {
      throw new Error('El médico ya tiene una cita agendada en ese horario.');
    }

    const doc = this.medicos.find(m => m.id === medicoId);
    const pac = this.pacientes.find(p => p.id === pacienteId);

    const nuevaCita = {
      id: 'cita-' + (this.citas.length + 1),
      medicoId,
      medicoNombre: doc ? doc.nombre : 'Médico',
      pacienteId,
      pacienteNombre: pac ? pac.nombre : 'Paciente',
      inicio,
      fin,
      motivo,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString()
    };
    this.citas.push(nuevaCita);
    return nuevaCita;
  }

  confirmarCita(citaId, medicoId) {
    const cita = this.citas.find(c => c.id === citaId);
    if (!cita) throw new Error('Cita no encontrada.');
    if (cita.medicoId !== medicoId) throw new Error('No autorizado para modificar citas de otro médico.');
    if (cita.estado === 'Cancelada') throw new Error('No se puede confirmar una cita cancelada.');
    cita.estado = 'Confirmada';
    return cita;
  }

  completarCita(citaId, medicoId) {
    const cita = this.citas.find(c => c.id === citaId);
    if (!cita) throw new Error('Cita no encontrada.');
    if (cita.medicoId !== medicoId) throw new Error('No autorizado.');
    cita.estado = 'Completada';
    return cita;
  }

  cancelarCita(citaId, ahora = new Date()) {
    const cita = this.citas.find(c => c.id === citaId);
    if (!cita) throw new Error('Cita no encontrada.');
    if (cita.estado === 'Cancelada' || cita.estado === 'Completada') {
      throw new Error('La cita no puede cancelarse en su estado actual.');
    }

    const inicio = new Date(cita.inicio);
    const limite24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    if (inicio <= limite24h) {
      throw new Error('La cancelación debe hacerse con al menos 24 horas de anticipación.');
    }

    cita.estado = 'Cancelada';
    return cita;
  }

  obtenerCitasPaciente(pacienteId) {
    return this.citas.filter(c => c.pacienteId === pacienteId);
  }

  obtenerEstadisticasAdmin() {
    return {
      totalCitas: this.citas.length,
      pendientes: this.citas.filter(c => c.estado === 'Pendiente').length,
      confirmadas: this.citas.filter(c => c.estado === 'Confirmada').length,
      completadas: this.citas.filter(c => c.estado === 'Completada').length,
      canceladas: this.citas.filter(c => c.estado === 'Cancelada').length,
      totalMedicos: this.medicos.length,
      totalPacientes: this.pacientes.length
    };
  }
}

describe('✅ ACCEPTANCE TESTING (Pruebas de Aceptación / UAT) - Criterios de Usuario', () => {
  let sistema;

  beforeEach(() => {
    sistema = new SistemaCitasAceptacion();
  });

  test('HU-01 [Paciente]: Reserva de Cita Exitosa en Horario Libre', () => {
    // DADO que María López (paciente) desea consultar con la Dra. Ana García
    const pacienteId = "pac-1";
    const medicoId = "med-1";
    const inicio = "2026-10-10T10:00:00";
    const fin = "2026-10-10T11:00:00";

    // CUANDO solicita la reserva con motivo "Consulta preventiva"
    const cita = sistema.agendarCita({
      medicoId,
      pacienteId,
      inicio,
      fin,
      motivo: "Consulta preventiva"
    });

    // ENTONCES la cita es registrada en estado Pendiente con los datos del paciente y médico
    assert.ok(cita.id.startsWith('cita-'));
    assert.equal(cita.estado, 'Pendiente');
    assert.equal(cita.medicoNombre, 'Dra. Ana García');
    assert.equal(cita.pacienteNombre, 'María López');
  });

  test('HU-02 [Integridad Clínica]: Rechazo de Reserva Solapada para el Mismo Especialista', () => {
    // DADO que María López ya tiene una cita agendada de 10:00 a 11:00 con la Dra. Ana García
    sistema.agendarCita({
      medicoId: "med-1",
      pacienteId: "pac-1",
      inicio: "2026-10-10T10:00:00",
      fin: "2026-10-10T11:00:00",
      motivo: "Primera cita"
    });

    // CUANDO Carlos Ruiz intenta reservar de 10:30 a 11:30 con la misma especialista
    // ENTONCES el sistema rechaza la solicitud protegiendo la agenda del médico
    assert.throws(() => {
      sistema.agendarCita({
        medicoId: "med-1",
        pacienteId: "pac-2",
        inicio: "2026-10-10T10:30:00",
        fin: "2026-10-10T11:30:00",
        motivo: "Intento solapado"
      });
    }, { message: 'El médico ya tiene una cita agendada en ese horario.' });
  });

  test('HU-03 [Médico]: Confirmación y Cierre de Atención de una Cita', () => {
    // DADO que existe una cita pendiente asignada a la Dra. Ana García
    const cita = sistema.agendarCita({
      medicoId: "med-1",
      pacienteId: "pac-1",
      inicio: "2026-10-12T09:00:00",
      fin: "2026-10-12T10:00:00",
      motivo: "Control de presión arterial"
    });

    // CUANDO la médica confirma la cita
    const citaConfirmada = sistema.confirmarCita(cita.id, "med-1");
    // ENTONCES el estado cambia a 'Confirmada'
    assert.equal(citaConfirmada.estado, 'Confirmada');

    // CUANDO finaliza la consulta médica
    const citaCompletada = sistema.completarCita(cita.id, "med-1");
    // ENTONCES el estado pasa a 'Completada'
    assert.equal(citaCompletada.estado, 'Completada');
  });

  test('HU-04 [Cancelación - Aceptada]: Paciente Cancela con más de 24 Horas de Anticipación', () => {
    // DADO una cita programada para dentro de 48 horas
    const ahora = new Date("2026-10-01T08:00:00Z");
    const inicioCita = "2026-10-03T10:00:00Z"; // 50 horas de diferencia

    const cita = sistema.agendarCita({
      medicoId: "med-1",
      pacienteId: "pac-1",
      inicio: inicioCita,
      fin: "2026-10-03T11:00:00Z",
      motivo: "Chequeo"
    });

    // CUANDO el paciente solicita la cancelación
    const cancelada = sistema.cancelarCita(cita.id, ahora);

    // ENTONCES la cancelación es aceptada y el estado es 'Cancelada'
    assert.equal(cancelada.estado, 'Cancelada');
  });

  test('HU-05 [Cancelación - Rechazada]: Sistema Bloquea Cancelaciones con menos de 24 Horas', () => {
    // DADO una cita agendada para dentro de 8 horas
    const ahora = new Date("2026-10-01T08:00:00Z");
    const inicioCita = "2026-10-01T16:00:00Z"; // solo 8 horas

    const cita = sistema.agendarCita({
      medicoId: "med-1",
      pacienteId: "pac-1",
      inicio: inicioCita,
      fin: "2026-10-01T17:00:00Z",
      motivo: "Urgencia menor"
    });

    // CUANDO el paciente intenta cancelarla a última hora
    // ENTONCES el sistema rechaza la solicitud exigiendo la política de 24 horas
    assert.throws(() => {
      sistema.cancelarCita(cita.id, ahora);
    }, { message: 'La cancelación debe hacerse con al menos 24 horas de anticipación.' });
  });

  test('HU-06 [Privacidad]: El Paciente Solo Visualiza sus Propias Citas Médicas', () => {
    // DADO que María tiene 2 citas y Carlos tiene 1 cita
    sistema.agendarCita({ medicoId: "med-1", pacienteId: "pac-1", inicio: "2026-10-15T09:00:00", fin: "2026-10-15T10:00:00", motivo: "Cita María 1" });
    sistema.agendarCita({ medicoId: "med-2", pacienteId: "pac-1", inicio: "2026-10-16T11:00:00", fin: "2026-10-16T12:00:00", motivo: "Cita María 2" });
    sistema.agendarCita({ medicoId: "med-1", pacienteId: "pac-2", inicio: "2026-10-17T14:00:00", fin: "2026-10-17T15:00:00", motivo: "Cita Carlos" });

    // CUANDO María consulta su portal de citas
    const citasMaria = sistema.obtenerCitasPaciente("pac-1");

    // ENTONCES ve exactamente 2 citas y ninguna le pertenece a otro paciente
    assert.equal(citasMaria.length, 2);
    citasMaria.forEach(c => assert.equal(c.pacienteId, "pac-1"));
  });

  test('HU-07 [Administrador]: El Tablero Refleja Métricas Consolidadas Precisas', () => {
    // DADO un flujo operativo con 1 cita confirmada, 1 pendiente y 1 cancelada
    const c1 = sistema.agendarCita({ medicoId: "med-1", pacienteId: "pac-1", inicio: "2026-10-20T09:00:00", fin: "2026-10-20T10:00:00", motivo: "M1" });
    const c2 = sistema.agendarCita({ medicoId: "med-1", pacienteId: "pac-2", inicio: "2026-10-20T11:00:00", fin: "2026-10-20T12:00:00", motivo: "M2" });
    const c3 = sistema.agendarCita({ medicoId: "med-2", pacienteId: "pac-1", inicio: "2026-10-25T14:00:00", fin: "2026-10-25T15:00:00", motivo: "M3" });

    sistema.confirmarCita(c1.id, "med-1");
    sistema.cancelarCita(c3.id, new Date("2026-10-01T00:00:00"));

    // CUANDO el Administrador consulta las métricas
    const stats = sistema.obtenerEstadisticasAdmin();

    // ENTONCES los totales concuerdan exactamente con la realidad clínica
    assert.equal(stats.totalCitas, 3);
    assert.equal(stats.confirmadas, 1);
    assert.equal(stats.pendientes, 1);
    assert.equal(stats.canceladas, 1);
    assert.equal(stats.totalMedicos, 2);
    assert.equal(stats.totalPacientes, 2);
  });

});
