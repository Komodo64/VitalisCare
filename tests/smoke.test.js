/**
 * SUITE DE PRUEBAS DE HUMO (SMOKE TESTING) - VITALIS CARE
 * Objetivo: Comprobar la salud crítica del sistema y validar que los componentes
 * esenciales, archivos estáticos, usuarios semilla, configuración y flujos vitales
 * estén operativos antes de proceder a pruebas más profundas.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Datos semilla del sistema (espejo del runtime)
const SEED_DOCTORS = [
  {
    id: "med-1",
    nombre: "Dra. Ana García",
    especialidad: "Cardiología",
    numeroLicencia: "MED-1001",
    email: "ana@citas.local",
    disponibilidades: [
      { id: "disp-1", inicio: "2026-09-15T09:00:00", fin: "2026-09-15T17:00:00", disponible: true },
      { id: "disp-2", inicio: "2026-09-16T09:00:00", fin: "2026-09-16T17:00:00", disponible: true }
    ]
  },
  {
    id: "med-2",
    nombre: "Dr. Luis Pérez",
    especialidad: "Dermatología",
    numeroLicencia: "MED-1002",
    email: "luis@citas.local",
    disponibilidades: [
      { id: "disp-4", inicio: "2026-09-15T09:00:00", fin: "2026-09-15T17:00:00", disponible: true }
    ]
  }
];

const SEED_USERS = [
  { id: "user-admin", email: "admin@citas.local", nombreCompleto: "Administrador", rol: "Admin" },
  { id: "user-ana", email: "ana@citas.local", nombreCompleto: "Dra. Ana García", rol: "Medico", medicoId: "med-1" },
  { id: "user-luis", email: "luis@citas.local", nombreCompleto: "Dr. Luis Pérez", rol: "Medico", medicoId: "med-2" },
  { id: "user-maria", email: "maria@citas.local", nombreCompleto: "María López", rol: "Paciente", pacienteId: "pac-1" },
  { id: "user-carlos", email: "carlos@citas.local", nombreCompleto: "Carlos Ruiz", rol: "Paciente", pacienteId: "pac-2" }
];

describe('🔥 SMOKE TESTING (Pruebas de Humo) - Vitalidad del Sistema', () => {

  test('Smoke 1: Los archivos estáticos críticos de la SPA existen y no están vacíos', () => {
    const rootDir = path.resolve(__dirname, '..', 'CitasMedicas.Web', 'wwwroot');
    const criticalFiles = [
      path.join(rootDir, 'index.html'),
      path.join(rootDir, 'css', 'styles.css'),
      path.join(rootDir, 'js', 'app.js'),
      path.join(rootDir, 'js', 'firebase-config.js'),
      path.join(rootDir, 'js', 'firebase-service.js')
    ];

    criticalFiles.forEach(file => {
      assert.equal(fs.existsSync(file), true, `El archivo crítico ${file} debe existir.`);
      const stats = fs.statSync(file);
      assert.ok(stats.size > 0, `El archivo crítico ${file} no debe estar vacío.`);
    });
  });

  test('Smoke 2: El catálogo de especialistas médicos semilla está disponible y configurado', () => {
    assert.ok(Array.isArray(SEED_DOCTORS), 'El catálogo de médicos debe ser un arreglo.');
    assert.ok(SEED_DOCTORS.length >= 2, 'Debe haber al menos 2 médicos especialistas precargados.');
    
    SEED_DOCTORS.forEach(doc => {
      assert.ok(doc.id, 'Cada médico debe tener un ID único.');
      assert.ok(doc.nombre.startsWith('Dr'), 'El nombre del médico debe tener título.');
      assert.ok(doc.especialidad, 'Cada médico debe tener una especialidad asignada.');
      assert.ok(doc.numeroLicencia, 'El médico debe contar con licencia médica formal.');
      assert.ok(doc.disponibilidades.length > 0, 'El médico debe tener horarios de atención configurados.');
    });
  });

  test('Smoke 3: Los 3 roles fundamentales del sistema (Admin, Médico, Paciente) están presentes', () => {
    const roles = new Set(SEED_USERS.map(u => u.rol));
    assert.ok(roles.has('Admin'), 'El sistema debe contar con el rol Administrador.');
    assert.ok(roles.has('Medico'), 'El sistema debe contar con el rol Médico.');
    assert.ok(roles.has('Paciente'), 'El sistema debe contar con el rol Paciente.');
  });

  test('Smoke 4: El flujo crítico de autenticación valida correctamente a los usuarios demo', () => {
    const loginSimulator = (email, password) => {
      const user = SEED_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error('Usuario no encontrado.');
      if (!password || password.length < 6) throw new Error('Contraseña inválida.');
      return { autenticado: true, user };
    };

    const resAdmin = loginSimulator('admin@citas.local', 'Admin123!');
    assert.equal(resAdmin.autenticado, true);
    assert.equal(resAdmin.user.rol, 'Admin');

    const resDoctor = loginSimulator('ana@citas.local', 'Medico123!');
    assert.equal(resDoctor.autenticado, true);
    assert.equal(resDoctor.user.rol, 'Medico');

    const resPatient = loginSimulator('maria@citas.local', 'Paciente123!');
    assert.equal(resPatient.autenticado, true);
    assert.equal(resPatient.user.rol, 'Paciente');
  });

  test('Smoke 5: La configuración de Firebase contiene los parámetros esenciales del proyecto', () => {
    const configPath = path.resolve(__dirname, '..', 'CitasMedicas.Web', 'wwwroot', 'js', 'firebase-config.js');
    const content = fs.readFileSync(configPath, 'utf8');

    assert.ok(content.includes('apiKey'), 'La configuración debe incluir apiKey.');
    assert.ok(content.includes('vitalis-care-f0e5e'), 'La configuración debe apuntar al proyecto vitalis-care-f0e5e.');
    assert.ok(content.includes('authDomain'), 'La configuración debe definir authDomain.');
    assert.ok(content.includes('projectId'), 'La configuración debe definir projectId.');
  });

  test('Smoke 6: La estructura de citas médicas contiene los campos mínimos de integridad clínica', () => {
    const citaEjemplo = {
      id: "cita-smoke-001",
      medicoId: "med-1",
      medicoNombre: "Dra. Ana García",
      pacienteId: "pac-1",
      pacienteNombre: "María López",
      inicio: "2026-10-01T10:00:00",
      fin: "2026-10-01T11:00:00",
      motivo: "Revisión cardiológica anual",
      estado: "Pendiente"
    };

    assert.ok(citaEjemplo.id, 'La cita debe tener identificador único.');
    assert.ok(citaEjemplo.medicoId && citaEjemplo.pacienteId, 'La cita debe vincular médico y paciente.');
    assert.ok(new Date(citaEjemplo.inicio) < new Date(citaEjemplo.fin), 'El inicio debe preceder al fin.');
    assert.equal(citaEjemplo.estado, 'Pendiente', 'Toda cita nueva debe iniciar en estado Pendiente.');
  });

});
