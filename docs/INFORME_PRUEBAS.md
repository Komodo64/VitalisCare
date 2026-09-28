# 🧪 INFORME INTEGRAL DE PRUEBAS DE SOFTWARE (QA): VITALIS CARE
> **Plataforma de Gestión de Citas Médicas y Salud Digital**  
> *Documento formal de Aseguramiento de Calidad para sustentación académica ante jurados y profesores.*

---

## 📑 1. Resumen Ejecutivo de la Estrategia de Calidad

Para garantizar la estabilidad, confiabilidad médica y seguridad de **Vitalis Care**, se implementó una estrategia piramidal de pruebas que abarca múltiples niveles de verificación:

| Modalidad de Prueba | Objetivo Principal | Herramienta / Framework | Cantidad de Pruebas | Documento Formal | Estado |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Pruebas Unitarias Backend** | Lógica de negocio pura de casos de uso y aislamiento con Moq. | .NET 9 + xUnit + Moq | 19 pruebas | [`EVI-QA-UT-001`](./EVI-QA-UT-001_INFORME_PRUEBAS_UNITARIAS.md) | ✅ 100% Pasadas |
| **Pruebas de Humo (Smoke)** | Vitalidad del core de la API (`/healthz`, endpoints primarios). | .NET 9 (`WebApplicationFactory`) + Node.js | 11 pruebas (5 .NET + 6 JS) | [`EVI-QA-SMK-002`](./EVI-QA-SMK-002_INFORME_PRUEBAS_HUMO.md) | ✅ 100% Pasadas |
| **Pruebas de Integración** | Pipeline HTTP, serialización DTO y persistencia relacional EF Core. | .NET 9 (`WebApplicationFactory`) | 5 pruebas | [`EVI-QA-INT-003`](./EVI-QA-INT-003_INFORME_PRUEBAS_INTEGRACION.md) | ✅ 100% Pasadas |
| **Pruebas de Aceptación (BDD)** | Criterios de aceptación Given-When-Then (Gherkin formal HU-01 a HU-07). | .NET 9 + Node.js BDD Runner | 14 pruebas (7 .NET + 7 JS) | [`EVI-QA-UAT-004`](./EVI-QA-UAT-004_INFORME_PRUEBAS_ACEPTACION_BDD.md) | ✅ 100% Pasadas |
| **Pruebas de Rendimiento** | Carga concurrente sostenida, P95 < 150ms y cero fallos (SLA). | NBomber v6.6.0 (.NET 9 C#) | 157,621 peticiones | [`EVI-QA-PERF-005`](./EVI-QA-PERF-005_INFORME_PRUEBAS_RENDIMIENTO.md) | ✅ SLA Cumplido |
| **Pruebas Exploratorias** | Investigación SBTM de ataques XSS, DoS, concurrencia y límites 24h. | Node.js Test Runner (`node:test`) | 12 pruebas | [`EVI-QA-EXP-006`](./EVI-QA-EXP-006_ACTA_PRUEBAS_EXPLORATORIAS.md) | ✅ 100% Pasadas |
| **Reglas de UI, Auth y Slots** | Alta médica admin, bloqueo temporal y liberación reactiva de turnos. | Node.js Test Runner (`node:test`) | 24 pruebas | [`EVI-QA-SUM-007`](./EVI-QA-SUM-007_MATRIZ_TRAZABILIDAD_Y_RESUMEN_CALIDAD.md) | ✅ 100% Pasadas |
| **TOTAL CONSOLIDADO** | **Cobertura integral de extremo a extremo del sistema** | **xUnit + NBomber + Node.js** | **85 pruebas automatizadas** | **Dossier 7 Documentos** | **✅ 100% Éxito** |

---

## 💨 2. Pruebas de Humo (Smoke Testing)

### 2.1 Definición y Propósito
El **Smoke Testing** (también conocido como *Build Verification Testing*) es una suite rápida de pruebas superficiales cuyo propósito es responder a la pregunta:  
> *"¿El sistema está lo suficientemente estable como para ser probado en profundidad, o la compilación básica está rota?"*

Si una sola prueba de humo falla, el despliegue se detiene inmediatamente.

### 2.2 Archivo de Implementación
* 📄 [`tests/smoke.test.js`](file:///c:/Users/User/Documents/CitasMedicas/tests/smoke.test.js)

### 2.3 Casos de Prueba Ejecutados

| ID | Caso de Humo | Verificación Técnica | Resultado |
| :--- | :--- | :--- | :---: |
| **SMK-01** | Integridad de Archivos Críticos | Verifica que `index.html`, `styles.css`, `app.js`, `firebase-config.js` y `firebase-service.js` existan y tengan contenido. | ✅ Superado |
| **SMK-02** | Disponibilidad de Especialistas | Comprueba que el catálogo semilla tenga al menos 2 médicos con licencia, especialidad y turnos. | ✅ Superado |
| **SMK-03** | Presencia de Roles del Sistema | Valida que existan usuarios configurados para los roles `Admin`, `Medico` y `Paciente`. | ✅ Superado |
| **SMK-04** | Vitalidad de Autenticación | Prueba el login de los 3 perfiles demo (`admin@citas.local`, `ana@citas.local`, `maria@citas.local`). | ✅ Superado |
| **SMK-05** | Configuración de Firebase Cloud | Valida la presencia de `apiKey`, `projectId: "vitalis-care-f0e5e"` y `authDomain`. | ✅ Superado |
| **SMK-06** | Integridad Estructural de Citas | Confirma que el modelo de datos de citas exija fechas cronológicas y estado inicial `Pendiente`. | ✅ Superado |

---

## 🎯 3. Pruebas de Aceptación (Acceptance Testing / UAT)

### 3.1 Definición y Metodología
Las **Pruebas de Aceptación del Usuario (UAT)** validan el software desde la perspectiva de las necesidades del usuario final y del negocio clínico. Se redactaron bajo la metodología **BDD (Behavior-Driven Development)** utilizando la sintaxis estándar:
- **Dado que (Given):** El contexto o estado inicial del sistema.
- **Cuando (When):** La acción realizada por el usuario.
- **Entonces (Then):** El resultado esperado y observable en el sistema.

### 3.2 Archivo de Implementación
* 📄 [`tests/acceptance.test.js`](file:///c:/Users/User/Documents/CitasMedicas/tests/acceptance.test.js)

### 3.3 Historias de Usuario Evaluadas

#### 👤 HU-01: Paciente Reserva Cita Médica
* **Dado que:** La paciente María López ingresa al portal y busca atención en Cardiología.
* **Cuando:** Selecciona un turno libre con la Dra. Ana García e ingresa el motivo de consulta.
* **Entonces:** El sistema agenda la cita en estado `Pendiente`, vincula los identificadores y descuenta el horario.
* *Resultado:* ✅ **Aprobado**.

#### 🛡️ HU-02: Prevención de Solapamiento Clínico
* **Dado que:** La Dra. Ana García ya cuenta con una cita médica agendada de 10:00 a 11:00.
* **Cuando:** Otro paciente intenta reservar con la misma especialista entre 10:30 y 11:30.
* **Entonces:** El sistema **rechaza** la transacción informando el conflicto de horario.
* *Resultado:* ✅ **Aprobado**.

#### 🩺 HU-03: Médico Confirma y Completa Cita
* **Dado que:** El médico cuenta con una cita en estado `Pendiente`.
* **Cuando:** El médico aprueba la consulta, el estado transiciona a `Confirmada`; al finalizar la atención médica, transiciona a `Completada`.
* **Entonces:** La cita queda archivada como registro clínico cerrado e inmutable.
* *Resultado:* ✅ **Aprobado**.

#### ⏰ HU-04 y HU-05: Política de Cancelación con 24 Horas de Anticipación
* **Escenario A (> 24h):** Un paciente solicita cancelar con 48 horas de antelación &rarr; **Aceptada**, estado pasa a `Cancelada`.
* **Escenario B (< 24h):** Un paciente solicita cancelar faltando 8 horas &rarr; **Rechazada**, el sistema emite una excepción de política clínica.
* *Resultado:* ✅ **Aprobado**.

#### 🔒 HU-06: Privacidad y Aislamiento de Datos entre Pacientes
* **Dado que:** Existen citas de diferentes pacientes en el sistema.
* **Cuando:** Un paciente consulta su portal personal.
* **Entonces:** Visualiza **únicamente** sus citas médicas; los registros de terceros están estrictamente filtrados.
* *Resultado:* ✅ **Aprobado**.

#### 📊 HU-07: Tablero Consolidado de Métricas para el Administrador
* **Dado que:** Existen múltiples citas en diferentes estados operativos.
* **Cuando:** El Administrador abre el Dashboard de gestión.
* **Entonces:** Las métricas de total de citas, pendientes, confirmadas, completadas y canceladas cuadran con exactitud matemática.
* *Resultado:* ✅ **Aprobado**.

---

## 🕵️ 4. Pruebas Exploratorias (Exploratory Testing)

### 4.1 Definición y Metodología SBTM
El **Testeo Exploratorio** es un enfoque estructurado de investigación donde el evaluador diseña y ejecuta pruebas simultáneamente para descubrir anomalías en los bordes del sistema.  
Se formalizó utilizando la metodología **SBTM (Session-Based Test Management)** organizada en **Cartas de Exploración (Charters)**:

### 4.2 Archivo de Implementación
* 📄 [`tests/exploratory.test.js`](file:///c:/Users/User/Documents/CitasMedicas/tests/exploratory.test.js)

### 4.3 Detalle de los Charters de Exploración

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHARTER 1: Seguridad y Payloads Maliciosos                              │
│ Misión: Evaluar la resistencia frente a inyecciones XSS, SQL y DoS.   │
├────────────────────────────────────────────────────────────────────────┤
│ • Exp-01: Inyección de tags <script> en motivo de consulta.           │
│   Comportamiento: El sistema sanitiza y remueve tags activos.           │
│ • Exp-02: Strings con comillas y comandos SQL ("DROP TABLE").          │
│   Comportamiento: Manejo como texto plano sin ejecución de sentencias. │
│ • Exp-03: Payloads de 50,000 caracteres (intento de Buffer Overflow). │
│   Comportamiento: Truncado estricto a 500 caracteres sin fuga de RAM.  │
│ • Exp-04: Inyección de caracteres nulos (Null Bytes \0).               │
│   Comportamiento: Purgado de bytes de control antes de persistir.      │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHARTER 2: Casos Límite y Fronteras Temporales                         │
│ Misión: Someter a prueba el cálculo de umbrales exactos de fecha y hora│
├────────────────────────────────────────────────────────────────────────┤
│ • Exp-05: Cancelación con 24 horas y 1 segundo de anticipación.        │
│   Comportamiento: PERMITIDA (cumple estrictamente el umbral mayor a 24h)│
│ • Exp-06: Cancelación con 23 horas, 59 min y 59 seg.                   │
│   Comportamiento: RECHAZADA (falta 1 segundo para el umbral mínimo).   │
│ • Exp-07: Cita en el cruce de medianoche (23:30 a 00:30 del día sgte). │
│   Comportamiento: Cálculo exacto de 60 minutos sin error de fecha.     │
│ • Exp-08: Citas con duración 0 segundos o fechas invertidas.           │
│   Comportamiento: Invalidadas de inmediato con excepción controlada.  │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHARTER 3: Concurrencia y Condición de Carrera (Race Conditions)       │
│ Misión: Evaluar el comportamiento ante dos reservas simultáneas.       │
├────────────────────────────────────────────────────────────────────────┤
│ • Exp-09: Dos pacientes disparan petición asíncrona en el mismo ms.    │
│   Comportamiento: Solo una petición resulta exitosa; la segunda es    │
│   rechazada atómicamente por colisión de horario.                      │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHARTER 4: Fuzzing de Caracteres Extremos y Normalización             │
│ Misión: Probar caracteres internacionales, acentos y entropía.         │
├────────────────────────────────────────────────────────────────────────┤
│ • Exp-10: Nombres con tildes, diéresis y emojis ("Dr. Müller 🩺").     │
│   Comportamiento: Preservación adecuada de caracteres UTF-8.           │
│ • Exp-11: Normalización de correos con espacios y mayúsculas.          │
│   Comportamiento: Conversión limpia a minúsculas y trim de bordes.     │
│ • Exp-12: Contraseñas de alta entropía con símbolos complejos.         │
│   Comportamiento: Parseo seguro y verificación de requisitos.          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 5. Instrucciones de Ejecución para la Sustentación

### Para correr TODO el suite unificado (63 pruebas):
```powershell
.\run-tests.ps1
```
*(O doble clic en `run-tests.bat`)*

### Para correr suites específicas con npm:
```bash
# Correr únicamente Pruebas de Humo:
npm run test:smoke

# Correr únicamente Pruebas de Aceptación (UAT):
npm run test:acceptance

# Correr únicamente Pruebas Exploratorias:
npm run test:exploratory

# Correr todas las pruebas de JavaScript:
npm test

# Correr las pruebas de backend en C#:
dotnet test
```

---

## 🎤 6. Guía de Respuestas a Preguntas de Jurados

| Pregunta del Profesor | Respuesta Sugerida |
| :--- | :--- |
| **¿Qué diferencia hay entre una prueba unitaria y una de humo?** | *"La prueba unitaria valida una función o método aislado en milisegundos. La prueba de humo valida la integración superficial del sistema completo (archivos, base de datos, login y arranque) para saber si la aplicación está viva."* |
| **¿Por qué usaron BDD en las pruebas de aceptación?** | *"Porque BDD vincula el lenguaje del negocio médico con el código. Usamos 'Dado-Cuando-Entonces' para certificar que el software cumple exactamente lo que esperan el paciente, el médico y el administrador."* |
| **¿Qué valor aportan las pruebas exploratorias si ya tenían pruebas unitarias?** | *"Las pruebas unitarias prueban lo que el desarrollador anticipó. Las pruebas exploratorias buscan deliberadamente romper el sistema: prueban casos de concurrencia simultánea, inyecciones de código, cruces de medianoche y segundos límite de cancelación."* |
| **¿Cómo probaron la concurrencia en la reserva de citas?** | *"En `exploratory.test.js` (Exp-09) disparamos dos peticiones asíncronas simultáneas con `Promise.all`. Verificamos que el sistema procese atómicamente una sola reserva y rechace la segunda para evitar sobreventa médica."* |

---
*Informe generado para el aseguramiento de calidad y sustentación de Vitalis Care.*
