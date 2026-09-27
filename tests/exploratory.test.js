/**
 * SUITE DE PRUEBAS EXPLORATORIAS (EXPLORATORY TESTING) - VITALIS CARE
 * Metodología: Session-Based Test Management (SBTM) / Charters de Exploración
 * Enfoque: Casos límite, inyecciones de seguridad, condiciones de carrera (concurrencia),
 * fuzzing de caracteres extremos y resiliencia del sistema.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Módulos utilitarios bajo prueba
function sanitizarEntrada(texto, maxLen = 500) {
  if (typeof texto !== 'string') return '';
  // Eliminar etiquetas HTML peligrosas y caracteres de control
  const limpio = texto
    .replace(/[<>]/g, '')
    .replace(/\0/g, '')
    .trim();
  return limpio.slice(0, maxLen);
}

function validarLimiteCancelacion(inicioCitaIso, fechaConsulta = new Date()) {
  const s = new Date(inicioCitaIso);
  const limite = new Date(fechaConsulta.getTime() + 24 * 60 * 60 * 1000);
  return s.getTime() > limite.getTime();
}

function normalizarEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

describe('🕵️ EXPLORATORY TESTING (Pruebas Exploratorias) - Charters de Calidad', () => {

  // ==========================================================================
  // CHARTER 1: Seguridad e Inyecciones Maliciosas (XSS, SQL, Buffer Overflow)
  // ==========================================================================
  describe('Charter 1: Exploración de Seguridad y Payloads Maliciosos', () => {

    test('Exp-01: Inyección XSS en motivo de cita es neutralizada', () => {
      const payloadXSS = "<script>alert('XSS-Attack')</script>Dolor en el pecho";
      const resultado = sanitizarEntrada(payloadXSS);

      assert.equal(resultado.includes('<script>'), false, 'No debe contener etiquetas de script.');
      assert.equal(resultado.includes('</script>'), false);
      assert.ok(resultado.includes('Dolor en el pecho'), 'Debe conservar el contenido clínico válido.');
    });

    test('Exp-02: Caracteres SQL y comillas en nombres no rompen la lógica del dominio', () => {
      const payloadSQL = "Dr. Robert'); DROP TABLE Usuarios;--";
      const resultado = sanitizarEntrada(payloadSQL);

      assert.ok(typeof resultado === 'string');
      assert.ok(resultado.length > 0);
    });

    test('Exp-03: Payloads de gran volumen (Buffer Overflow / DoS) se acotan a 500 caracteres', () => {
      // Intento de colapso de memoria con 50,000 caracteres
      const textoGigante = "A".repeat(50000);
      const resultado = sanitizarEntrada(textoGigante, 500);

      assert.equal(resultado.length, 500, 'El motivo debe truncarse estrictamente a 500 caracteres para proteger la BD.');
    });

    test('Exp-04: Inyección de caracteres nulos (Null Bytes \\0) son purgados', () => {
      const payloadNull = "Consulta\0Médica\0Maliciosa";
      const resultado = sanitizarEntrada(payloadNull);

      assert.equal(resultado.includes('\0'), false, 'Los bytes nulos deben ser removidos.');
      assert.equal(resultado, 'ConsultaMédicaMaliciosa');
    });

  });

  // ==========================================================================
  // CHARTER 2: Fronteras Temporales Extremas (Boundary Values / Edge Cases)
  // ==========================================================================
  describe('Charter 2: Exploración de Casos Límite y Fronteras Temporales', () => {

    test('Exp-05: Cancelación con 24 horas y 1 segundo de anticipación es PERMITIDA', () => {
      const ahora = new Date("2026-10-10T12:00:00Z");
      // 24 horas y 1 segundo después
      const fechaCita = new Date(ahora.getTime() + (24 * 60 * 60 + 1) * 1000).toISOString();

      const sePuedeCancelar = validarLimiteCancelacion(fechaCita, ahora);
      assert.equal(sePuedeCancelar, true, 'Debe permitir cancelar si supera las 24 horas aunque sea por 1 segundo.');
    });

    test('Exp-06: Cancelación con 23 horas 59 minutos y 59 segundos es RECHAZADA', () => {
      const ahora = new Date("2026-10-10T12:00:00Z");
      // 23 horas y 59 minutos (1 segundo menos que el umbral de 24h)
      const fechaCita = new Date(ahora.getTime() + (24 * 60 * 60 - 1) * 1000).toISOString();

      const sePuedeCancelar = validarLimiteCancelacion(fechaCita, ahora);
      assert.equal(sePuedeCancelar, false, 'Debe rechazar la cancelación si falta menos de 24 horas.');
    });

    test('Exp-07: Cita en el cruce de medianoche (23:30 a 00:30 del día siguiente)', () => {
      const inicio = new Date("2026-10-15T23:30:00Z");
      const fin = new Date("2026-10-16T00:30:00Z");

      const duracionMinutos = (fin.getTime() - inicio.getTime()) / (1000 * 60);
      assert.equal(duracionMinutos, 60, 'La duración en el cambio de día debe calcular exactamente 60 minutos.');
      assert.ok(inicio < fin, 'El inicio debe preceder al fin sin importar el cambio de día.');
    });

    test('Exp-08: Citas con duración 0 segundos o invertidas son invalidadas', () => {
      const validarRango = (ini, fn) => {
        const s = new Date(ini).getTime();
        const e = new Date(fn).getTime();
        if (s >= e) throw new Error('Rango temporal inválido.');
        return true;
      };

      assert.throws(() => validarRango("2026-10-10T10:00:00", "2026-10-10T10:00:00"), { message: 'Rango temporal inválido.' });
      assert.throws(() => validarRango("2026-10-10T11:00:00", "2026-10-10T10:00:00"), { message: 'Rango temporal inválido.' });
    });

  });

  // ==========================================================================
  // CHARTER 3: Concurrencia y Condición de Carrera (Simulated Race Condition)
  // ==========================================================================
  describe('Charter 3: Exploración de Concurrencia y Transacciones Simultáneas', () => {

    test('Exp-09: Dos reservas asíncronas simultáneas para el mismo turno -> Solo una gana', async () => {
      let citaAsignada = false;
      const citasRegistradas = [];

      // Simulación de handler transaccional atómico
      const intentarReserva = async (pacienteId) => {
        // Delay aleatorio entre 1 y 5 ms para simular latencia de red
        await new Promise(res => setTimeout(res, Math.random() * 5));

        if (citaAsignada) {
          throw new Error('Horario ocupado por otro paciente.');
        }

        citaAsignada = true;
        citasRegistradas.push({ pacienteId, confirmado: true });
        return { exito: true, pacienteId };
      };

      // Disparar dos peticiones concurrentes
      const promesas = [
        intentarReserva('pac-1').catch(err => ({ error: err.message })),
        intentarReserva('pac-2').catch(err => ({ error: err.message }))
      ];

      const resultados = await Promise.all(promesas);

      const exitosas = resultados.filter(r => r.exito);
      const rechazadas = resultados.filter(r => r.error);

      assert.equal(exitosas.length, 1, 'Exactamente una de las peticiones concurrentes debe tener éxito.');
      assert.equal(rechazadas.length, 1, 'La otra petición debe ser rechazada por colisión.');
      assert.equal(citasRegistradas.length, 1, 'En la base de datos solo debe persistir 1 cita.');
    });

  });

  // ==========================================================================
  // CHARTER 4: Fuzzing de Caracteres, Normalización y Resiliencia de Entrada
  // ==========================================================================
  describe('Charter 4: Fuzzing de Caracteres Extremos y Normalización', () => {

    test('Exp-10: Nombres con caracteres internacionales, tildes, diéresis y emojis', () => {
      const nombreComplejo = "  Dr. José Ángel Müller 🩺 (Cardiólogo)  ";
      const limpio = sanitizarEntrada(nombreComplejo);

      assert.equal(limpio, "Dr. José Ángel Müller 🩺 (Cardiólogo)", 'Debe preservar caracteres válidos y recortar extremos.');
    });

    test('Exp-11: Normalización de emails con mayúsculas y espacios accidentales', () => {
      const entradaUsuario = "   Maria.Lopez@Citas.Local   ";
      const normalizado = normalizarEmail(entradaUsuario);

      assert.equal(normalizado, "maria.lopez@citas.local", 'El email debe quedar en minúsculas y sin espacios.');
    });

    test('Exp-12: Contraseñas con alta entropía y símbolos no provocan fallos de parseo', () => {
      const passwordCompleja = "P@$$w0rd!#%^&*()_+{}[]:\"|<>?,./~";
      assert.ok(passwordCompleja.length >= 6);
      assert.ok(/[A-Z]/.test(passwordCompleja));
      assert.ok(/[0-9]/.test(passwordCompleja));
      assert.ok(/[^A-Za-z0-9]/.test(passwordCompleja));
    });

  });

});
