const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function generateHourlySlots(disponibilidades, referenceTime) {
  const slots = [];
  const now = referenceTime || new Date();

  disponibilidades.forEach(disp => {
    if (!disp.disponible) return;

    let slotStart = new Date(disp.inicio);
    const windowEnd = new Date(disp.fin);

    while (slotStart < windowEnd) {
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      if (slotEnd <= windowEnd && slotStart > now) {
        slots.push({
          inicio: slotStart.toISOString(),
          fin: slotEnd.toISOString()
        });
      }
      slotStart = slotEnd;
    }
  });

  return slots;
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate().toString().padStart(2, '0');
  const hours = d.getUTCHours().toString().padStart(2, '0');
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  return { month, day, time: `${hours}:${minutes}`, fullDate: `${day} ${month} ${d.getUTCFullYear()}` };
}

describe('Utilidades de Interfaz de Usuario (Frontend UI Helpers)', () => {

  test('escapeHtml: previene ataques de inyección XSS', () => {
    const input = '<img src=x onerror="alert(1)"> & "quotes" \'single\'';
    const output = escapeHtml(input);
    assert.equal(output, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quotes&quot; &#39;single&#39;');
  });

  test('generateHourlySlots: divide una jornada de 4 horas en 4 citas exactas de 1 hora', () => {
    const ref = new Date('2026-09-01T08:00:00Z');
    const disp = [{
      inicio: '2026-09-10T09:00:00Z',
      fin: '2026-09-10T13:00:00Z',
      disponible: true
    }];
    const slots = generateHourlySlots(disp, ref);
    assert.equal(slots.length, 4);
    assert.equal(slots[0].inicio, '2026-09-10T09:00:00.000Z');
    assert.equal(slots[0].fin, '2026-09-10T10:00:00.000Z');
    assert.equal(slots[3].inicio, '2026-09-10T12:00:00.000Z');
    assert.equal(slots[3].fin, '2026-09-10T13:00:00.000Z');
  });

  test('generateHourlySlots: excluye horarios que ya están en el pasado', () => {
    // La jornada fue de 08:00 a 12:00, pero la hora de referencia son las 10:30
    const ref = new Date('2026-09-10T10:30:00Z');
    const disp = [{
      inicio: '2026-09-10T08:00:00Z',
      fin: '2026-09-10T12:00:00Z',
      disponible: true
    }];
    const slots = generateHourlySlots(disp, ref);
    // Solo el slot de 11:00 a 12:00 empieza después de las 10:30
    assert.equal(slots.length, 1);
    assert.equal(slots[0].inicio, '2026-09-10T11:00:00.000Z');
    assert.equal(slots[0].fin, '2026-09-10T12:00:00.000Z');
  });

  test('formatDisplayDate: extrae componentes de fecha correctamente en formato legible', () => {
    const res = formatDisplayDate('2026-11-15T09:45:00Z');
    assert.equal(res.month, 'Nov');
    assert.equal(res.day, '15');
    assert.equal(res.time, '09:45');
    assert.equal(res.fullDate, '15 Nov 2026');
  });
});
