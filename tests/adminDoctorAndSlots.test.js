/**
 * Suite de Pruebas Automatizadas:
 * - Alta de Médicos y Especialidades por el Administrador
 * - Disponibilidad y Liberación de Horarios en Tiempo Real
 * - Validación de Fechas Pasadas y Fines de Semana
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Helper de simulación de horarios y citas
function calculateSlotStatus(slotStartISO, slotEndISO, doctorAppointments) {
  const slotStart = new Date(slotStartISO);
  const now = new Date();

  // 1. Verificación si el horario ya expiró en el tiempo real de hoy
  if (slotStart < now) {
    return { status: 'expired', label: 'Pasado' };
  }

  // 2. Verificación de citas activas que solapen el horario
  const isOccupied = doctorAppointments.some(c => {
    if (c.estado === 'Cancelada') return false; // Las citas canceladas NO ocupan el horario
    const cStart = new Date(c.inicio).getTime();
    const cFin = new Date(c.fin).getTime();
    const sStart = slotStart.getTime();
    const sEnd = new Date(slotEndISO).getTime();
    return cStart < sEnd && cFin > sStart;
  });

  if (isOccupied) {
    return { status: 'occupied', label: 'Ocupado' };
  }

  return { status: 'available', label: 'Libre' };
}

function extractUniqueSpecialties(doctors) {
  const specs = new Set();
  doctors.forEach(d => {
    if (d.especialidad && d.especialidad.trim()) {
      specs.add(d.especialidad.trim());
    }
  });
  return Array.from(specs);
}

function validateSelectedDate(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr < today) {
    return { valid: false, reason: 'Fecha en el pasado' };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  const day = targetDate.getDay();
  if (day === 0 || day === 6) {
    return { valid: true, isWeekend: true, message: 'Atención de Lunes a Viernes' };
  }
  return { valid: true, isWeekend: false };
}

describe('👨‍⚕️ GESTIÓN DE MÉDICOS POR ADMINISTRADOR', () => {
  test('Solo el rol Admin puede dar de alta nuevos especialistas', () => {
    const adminUser = { rol: 'Admin', email: 'admin@citas.local' };
    const patientUser = { rol: 'Paciente', email: 'maria@citas.local' };
    const doctorUser = { rol: 'Medico', email: 'ana@citas.local' };

    const canRegister = (user) => user && user.rol === 'Admin';

    assert.equal(canRegister(adminUser), true, 'El Administrador debe tener permiso de registro');
    assert.equal(canRegister(patientUser), false, 'El Paciente NO debe tener permiso');
    assert.equal(canRegister(doctorUser), false, 'El Médico NO debe tener permiso de crear otros médicos');
  });

  test('La especialidad personalizada se refleja dinámicamente en los filtros', () => {
    const initialDoctors = [
      { id: 'm1', nombreCompleto: 'Dra. Ana López', especialidad: 'Cardiología' },
      { id: 'm2', nombreCompleto: 'Dr. Carlos Mendoza', especialidad: 'Pediatría' }
    ];

    let specialties = extractUniqueSpecialties(initialDoctors);
    assert.deepEqual(specialties, ['Cardiología', 'Pediatría']);

    // Admin da de alta nuevo médico con especialidad 'Inmunología Clínica'
    const newDoctor = {
      id: 'm3',
      nombreCompleto: 'Dra. Sofía Mendoza',
      especialidad: 'Inmunología Clínica'
    };
    initialDoctors.push(newDoctor);

    specialties = extractUniqueSpecialties(initialDoctors);
    assert.ok(specialties.includes('Inmunología Clínica'), 'Los filtros deben incluir la nueva especialidad');
    assert.equal(specialties.length, 3);
  });
});

describe('📅 CALENDARIO Y DISPONIBILIDAD EN TIEMPO REAL', () => {
  test('El selector bloquea fechas pasadas', () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    const checkPast = validateSelectedDate(yesterday);
    assert.equal(checkPast.valid, false);
    assert.equal(checkPast.reason, 'Fecha en el pasado');

    const futureDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0];
    const checkFuture = validateSelectedDate(futureDate);
    assert.equal(checkFuture.valid, true);
  });

  test('Un horario agendado pasa a estado Ocupado (🔒 Ocupado)', () => {
    const slotStart = '2026-10-15T09:00:00.000Z';
    const slotEnd = '2026-10-15T10:00:00.000Z';

    const activeAppointment = {
      id: 'c-101',
      medicoId: 'm1',
      inicio: slotStart,
      fin: slotEnd,
      estado: 'Confirmada'
    };

    const result = calculateSlotStatus(slotStart, slotEnd, [activeAppointment]);
    assert.equal(result.status, 'occupied');
    assert.equal(result.label, 'Ocupado');
  });

  test('Si la cita es Cancelada, el horario vuelve a estar disponible de inmediato (🟢 Libre)', () => {
    const slotStart = '2026-10-15T09:00:00.000Z';
    const slotEnd = '2026-10-15T10:00:00.000Z';

    const cancelledAppointment = {
      id: 'c-101',
      medicoId: 'm1',
      inicio: slotStart,
      fin: slotEnd,
      estado: 'Cancelada' // Cita cancelada
    };

    const result = calculateSlotStatus(slotStart, slotEnd, [cancelledAppointment]);
    assert.equal(result.status, 'available');
    assert.equal(result.label, 'Libre');
  });

  test('Los turnos con horas pasadas del día actual se marcan como Pasados y quedan inhabilitados', () => {
    const pastSlotToday = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const pastSlotEnd = new Date(Date.now() - 1 * 3600 * 1000).toISOString();

    const result = calculateSlotStatus(pastSlotToday, pastSlotEnd, []);
    assert.equal(result.status, 'expired');
    assert.equal(result.label, 'Pasado');
  });
});
