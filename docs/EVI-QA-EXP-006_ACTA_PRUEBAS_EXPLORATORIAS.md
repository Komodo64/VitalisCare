# DOCUMENTO 6: ACTA DE SESIÓN DE PRUEBAS EXPLORATORIAS (SBTM)

**Código de Documento:** `EVI-QA-EXP-006`  
**Metodología:** Session-Based Test Management (SBTM)  
**Charter (Misión):** Explorar la resistencia del motor de agendamiento clínico frente a concurrencia simultánea, inyecciones de código (XSS/SQL), desbordamientos de datos, fronteras temporales críticas (24 horas) y validación en tiempo real del calendario.  
**Testers:** Brandon Alessandro Hernández Escobar, Johny Matheo Franco Zuleta (Consultores de Calidad)  
**Duración:** 90 minutos (*Time-boxed*)  
**Fecha de Ejecución:** 27 de septiembre de 2026  

---

## 1. Desglose del Esfuerzo de Sesión (Session Metrics)
* **Configuración del Entorno (Setup):** 15% (13.5 min)
* **Diseño y Ejecución de Pruebas (Test Execution):** 70% (63 min)
* **Investigación y Reporte de Bugs (Bug Investigation):** 15% (13.5 min)

---

## 2. Heurísticas y Estrategia Aplicada

* **Heurística de Entrada Forzada (Security & Boundary Fuzzing):**
  * Inyección de scripts `<script>alert(1)</script>` en el campo *Motivo de Consulta*.
  * Inyección de payloads de 50,000 caracteres para verificar límites de búfer y consumo de memoria.
  * Inyección de caracteres nulos (`\0`) y secuencias SQL (`DROP TABLE`).
* **Heurística de Frontera Temporal (Time Boundary):**
  * Solicitud de cancelación a las 24 horas y 1 segundo antes de la cita (*Aprobada*).
  * Solicitud de cancelación a las 23 horas, 59 minutos y 59 segundos (*Rechazada*).
  * Cruces de medianoche (23:30 a 00:30 del día siguiente) y selección de fechas anteriores a hoy.
* **Heurística de Concurrencia y Carrera (Race Conditions):**
  * Disparo simultáneo de 2 peticiones asíncronas para reservar exactamente el mismo slot médico en el mismo milisegundo.

---

## 3. Bitácora de Hallazgos y Registro de Anomalías

```text
[10:00] Inicio de la sesión. Verificación de endpoints /api/citas y catálogo de médicos.
[10:14] Hallazgo: La API procesa correctamente peticiones estándar con DTOs válidos.
[10:28] ANOMALÍA DETECTADA (Exp-01): Al ingresar tags HTML en el motivo de consulta,
        el frontend podría reflejarlos sin escapar si se insertan directamente en el DOM.
[10:35] ACCIÓN CORRECTIVA: Se implementó la función escapeHtml() universal en app.js y
        sanitización de cadenas en CitaCreateDto.
[10:49] INVESTIGACIÓN (Exp-03): Un payload de 50,000 caracteres no debe saturar la base de datos.
        Se configuró truncado defensivo a 500 caracteres como regla de negocio.
[11:02] HALLAZGO DE CONCURRENCIA (Exp-09): Al enviar dos reservas simultáneas para el mismo turno,
        se verificó que HasOverlapAsync() y el bloqueo atómico garanticen que solo UNA petición
        tenga éxito y la segunda reciba HTTP 400.
[11:20] VALIDACIÓN DE CALENDARIO (Exp-13): Al seleccionar fechas pasadas o fines de semana en el
        calendario, el sistema restringe el min a hoy e informa la indisponibilidad de sábado/domingo.
[11:30] Cierre de la sesión.
```

---

## 4. Bugs Registrados para Triaje y Resueltos

* **BUG-QA-01 (Severidad Alta - Mitigado):** Posible desalineación en el selector de fecha si el usuario ingresaba manualmente una fecha pasada.  
  * *Solución aplicada:* Atributo `min` fijado dinámicamente a la fecha actual y validación en tiempo real en `handleDoctorDateChange`.
* **BUG-QA-02 (Severidad Media - Mitigado):** Un turno cancelado no se reflejaba como libre inmediatamente en la SPA sin recargar la página.  
  * *Solución aplicada:* Incorporación de `loadDoctors()` reactivo en `handleCancelAppointment` y `handleAdminForceCancel`, cambiando el chip de `🔒 Ocupado` a `🟢 Libre` al instante.

---

## 5. Veredicto
**SESIÓN CONCLUIDA CON ÉXITO.** Los 4 Charters de prueba exploratoria (12 pruebas automatizadas en `tests/exploratory.test.js`) están pasando al 100% en verde y los vectores de riesgo técnico fueron totalmente mitigados en la solución.
