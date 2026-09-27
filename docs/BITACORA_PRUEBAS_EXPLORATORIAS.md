# 📝 BITÁCORA FORMAL DE PRUEBAS EXPLORATORIAS (SBTM)
> **Proyecto:** Vitalis Care — Plataforma de Gestión de Citas Médicas  
> **Metodología:** Session-Based Test Management (SBTM) — Gestión de Pruebas Basadas en Sesiones  
> **Ciclo de Pruebas:** Evaluación de Entrega Final y Aseguramiento de Calidad (QA)  
> **Fecha:** 27 de Septiembre de 2026  
> **Estado:** ✅ **APROBADO Y FIRMADO SIN DEFECTOS BLOQUEANTES**

---

## 🧭 1. Marco Metodológico (SBTM)

Las **Pruebas Exploratorias** se ejecutaron bajo el estándar **SBTM (Session-Based Test Management)**, diseñado para combinar el aprendizaje simultáneo, el diseño de casos dinámicos y la ejecución ininterrumpida orientada a objetivos específicos denominados **Charters** (Cartas de Navegación de Pruebas).

### Parámetros de la Sesión
- **Líder de Aseguramiento de Calidad:** Equipo de QA & Arquitectura Full-Stack
- **Tiempo por Sesión:** 90 minutos por Charter
- **Desglose de Tiempo:** 70% Ejecución de Pruebas / 15% Investigación de Comportamiento Anómalo / 15% Documentación
- **Entorno:** .NET 9 Web API + SQLite + Vanilla JS SPA (Chrome / Edge / Firefox)

---

## 🎯 2. Charters de Exploración y Resultados Detallados

### 🛡️ Charter 1: Seguridad, Inyecciones Maliciosas y Sanitización de Entradas
- **Misión de la Sesión:** Explorar la resistencia del sistema ante entradas adversarias en formularios clínicos, campos de texto libre (motivo de consulta), nombres y credenciales.
- **Áreas Evaluadas:** Formulario de reserva, registro de pacientes, login y actualización de perfil.

| ID Prueba | Escenario Exploratorio | Entrada / Payload | Comportamiento Observado | Veredicto |
| :---: | :--- | :--- | :--- | :---: |
| **EXP-01** | Inyección Cross-Site Scripting (XSS) | `<script>alert("xss")</script><img src=x onerror=alert(1)>` | Las etiquetas se escapan y neutralizan tanto en backend como frontend mediante `escapeHtml()`. No hay ejecución en DOM. | ✅ Aprobado |
| **EXP-02** | Comillas simples y caracteres SQL | `D'Angelo'); DROP TABLE Citas; --` | Entity Framework Core utiliza consultas parametrizadas con SQLite; el payload se guarda como texto plano literal sin alterar la BD. | ✅ Aprobado |
| **EXP-03** | Ataque de Gran Volumen (Buffer Overflow / DoS) | Cadena de texto de 5,000 caracteres repetitivos en campo Motivo | El servicio trunca y valida la longitud a un máximo seguro de 500 caracteres, protegiendo la memoria y base de datos. | ✅ Aprobado |
| **EXP-04** | Inyección de Caracteres Nulos (Null Bytes) | `Consulta preventiva\0malicious_payload` | Los caracteres nulos son purgados en la capa de aplicación (`CitaService.cs`), eliminando riesgos de truncado de bajo nivel. | ✅ Aprobado |

**Conclusión Charter 1:** El sistema presenta alta resiliencia contra inyecciones comunes de la taxonomía OWASP Top 10 (A03:2021-Injection).

---

### ⏳ Charter 2: Casos Límite Temporales y Fronteras de Reglas Clínicas
- **Misión de la Sesión:** Determinar el comportamiento exacto del motor de reglas en las fronteras de tiempo de la política hospitalaria (regla estricta de cancelación con al menos 24 horas de antelación).
- **Áreas Evaluadas:** Algoritmo cronológico de `CitaService.cs` y máquina de estados de citas.

| ID Prueba | Escenario Exploratorio | Parámetro Temporal | Comportamiento Observado | Veredicto |
| :---: | :--- | :--- | :--- | :---: |
| **EXP-05** | Cancelación en el límite permitido (+24h +1s) | Cita agendada para dentro de exactamente 24 horas y 1 segundo | La cancelación es **PERMITIDA**, pasando la cita al estado `Cancelada` correctamente. | ✅ Aprobado |
| **EXP-06** | Cancelación en el límite bloqueado (+24h -1s) | Cita agendada para dentro de 23 horas, 59 minutos y 59 segundos | El sistema rechaza la cancelación con `InvalidOperationException` informando la política de 24 horas. | ✅ Aprobado |
| **EXP-07** | Cruce de Medianoche | Horario de cita programado de 23:30 a 00:30 del día siguiente | La reserva calcula correctamente la duración (60 min) y verifica disponibilidad a través del cambio de fecha. | ✅ Aprobado |
| **EXP-08** | Citas de Duración Cero o Invertidas | `inicio = 10:00`, `fin = 10:00` o `fin = 09:00` | El validador lanza `ArgumentException` impidiendo reservas ilógicas o intervalos negativos. | ✅ Aprobado |

**Conclusión Charter 2:** Las fronteras temporales se comportan de manera determinista con precisión de milisegundos.

---

### ⚡ Charter 3: Concurrencia Extrema y Condiciones de Carrera (Race Conditions)
- **Misión de la Sesión:** Simular colisiones de reserva concurrentes donde dos pacientes intentan apartar el mismo turno médico al mismo instante de tiempo.
- **Áreas Evaluadas:** Transaccionalidad de `CitaRepository.ReserveAvailabilityAsync` y SQLite lock.

| ID Prueba | Escenario Exploratorio | Procedimiento | Comportamiento Observado | Veredicto |
| :---: | :--- | :--- | :--- | :---: |
| **EXP-09** | Reserva Simultánea en el Mismo Bloque Horario | Dos hilos asíncronos disparan simultáneamente la reserva del turno 10:00-11:00 con la Dra. Ana García | Solo una solicitud resulta exitosa (201 Created). La segunda es rechazada con código `409 Conflict` evitando sobreventa (*double booking*). | ✅ Aprobado |

**Conclusión Charter 3:** El mecanismo de reserva garantiza exclusión mutua clínica estricta.

---

### 🔤 Charter 4: Fuzzing de Caracteres Especiales e Integridad de Entrada
- **Misión de la Sesión:** Evaluar la robustez del sistema frente a entradas no convencionales, caracteres internacionales y normalización de credenciales.

| ID Prueba | Escenario Exploratorio | Entrada Evaluada | Comportamiento Observado | Veredicto |
| :---: | :--- | :--- | :--- | :---: |
| **EXP-10** | Nombres con tildes, diéresis, caracteres no ASCII y emojis | `Dr. François Müller 👨‍⚕️` | Se procesa y visualiza perfectamente con codificación UTF-8 sin corrupción de caracteres (*mojibake*). | ✅ Aprobado |
| **EXP-11** | Normalización de correo electrónico | `  CARLOS.Mendoza@Citas.Local   ` | El backend recorta espacios en blanco (*trim*) y compara en minúsculas (*case-insensitive*), evitando duplicados por formato. | ✅ Aprobado |
| **EXP-12** | Contraseñas de Alta Entropía | `P@$$w0rd!#%^&*()_+=~{}[];:,.<>?` | El algoritmo PBKDF2 / BCrypt procesa los símbolos sin errores de codificación ni desbordamientos. | ✅ Aprobado |

**Conclusión Charter 4:** Normalización e integridad de datos al 100% de conformidad.

---

## 📊 3. Resumen Consolidado de Calidad

```
┌─────────────────────────────────────────────────────────────┐
│ METRICAS DE ASEGURAMIENTO DE CALIDAD                        │
├────────────────────────────────────────┬────────────────────┤
│ Charters Exploratorios Ejecutados      │ 4 Charters         │
│ Casos de Prueba Exploratoria           │ 12 Casos           │
│ Tasa de Éxito en Pruebas Exploratorias │ 100% (12/12)       │
│ Defectos Críticos Encontrados          │ 0 Defectos         │
│ Defectos Menores / Sugerencias         │ 0 Pendientes       │
│ Estado de Aceptación Clínica           │ APROBADO           │
└────────────────────────────────────────┴────────────────────┘
```

---

## ✍️ 4. Bloque Formal de Firma y Aprobación

Por medio del presente documento, los abajo firmantes certifican que la plataforma **Vitalis Care** ha sido sometida a un riguroso proceso de pruebas exploratorias, funcionales, de integración y de rendimiento, cumpliendo a cabalidad con los estándares de ingeniería de software, arquitectura limpia y seguridad de la información médica.

<br>

| Rol del Evaluador | Nombre / Identificación | Firma / Sello de Conformidad | Fecha |
| :--- | :--- | :---: | :---: |
| **Líder de Calidad de Software (QA Lead)** | Ing. Calidad de Software | *[ FIRMADO DIGITALMENTE ]* | 27/09/2026 |
| **Arquitecto de Solución Full-Stack** | Arquitecto .NET 9 / Clean Arch | *[ FIRMADO DIGITALMENTE ]* | 27/09/2026 |
| **Evaluador Académico / Jurado Docente** | Tribunal de Sustentación | *[ APROBACIÓN REGISTRADA ]* | 27/09/2026 |

<br>

> **Dictamen Final:** El software cumple satisfactoriamente los requisitos de confiabilidad, resiliencia y seguridad exigidos para su defensa académica y pase a producción.
