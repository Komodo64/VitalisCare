# 📋 GUÍA DE EXPOSICIÓN DEL PROYECTO: VITALIS CARE
> **Plataforma Integral de Gestión de Citas Médicas y Salud Digital**  
> *Guía rápida para el expositor: qué decir, qué archivos abrir y qué funciones mostrar al profesor.*

---

## 🧭 1. Resumen Ejecutivo del Proyecto (Para Iniciar la Exposición)

**¿Qué es Vitalis Care?**  
Es un sistema web de gestión médica que permite a **Pacientes**, **Médicos** y **Administradores** gestionar citas médicas en tiempo real, respetando estrictas reglas de negocio clínico (bloqueo de solapamientos, cancelación con 24 horas de anticipación, división de jornadas en turnos de 1 hora y prevención de vulnerabilidades XSS).

**Pila Tecnológica (Stack):**
1. **Frontend:** Single Page Application (SPA) desarrollada con HTML5 semántico, CSS3 moderno (diseño responsivo, paleta clínica, micro-animaciones) y JavaScript modular (ES Modules).
2. **Backend en la Nube:** **Firebase** (Firebase Authentication + Cloud Firestore) para autenticación y base de datos NoSQL en tiempo real, con capa resiliente dual.
3. **Backend API en C#:** Arquitectura Limpia (**Clean Architecture** en .NET 9) dividida en capas independientes (*Domain, Application, Infrastructure, Web*).
4. **Pruebas Unitarias Duales:**
   - **19 pruebas** en JavaScript (Node.js Test Runner) para lógica frontend y validaciones.
   - **19 pruebas** en C# (.NET 9 + xUnit + Moq) para casos de uso del backend.
   - **Total:** 38 pruebas unitarias automatizadas (100% aprobadas).

> 📊 **Diagramas Técnicos:** Puedes consultar y mostrar todos los diagramas formales (Casos de Uso, Clases, Secuencia, Estados, Arquitectura y DER) en el documento: **[`docs/DIAGRAMAS_UML.md`](docs/DIAGRAMAS_UML.md)**.

---

## 📂 2. Catálogo de Archivos Clave para Mostrar

Aquí tienes la lista organizada de archivos que debes abrir en tu editor de código para explicárselos al profesor:

---

### A. Capa Frontend y Experiencia de Usuario (SPA)

#### 1. [`CitasMedicas.Web/wwwroot/index.html`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/index.html)
* **¿Qué hace este archivo?**  
  Es la interfaz gráfica completa en formato SPA (Single Page Application). No recarga la página al navegar entre pantallas; contiene la barra de navegación, la landing page pública, los 3 paneles por rol (Paciente, Médico y Administrador) y los modales de autenticación y reserva de citas.
* **Qué mostrarle al profesor:**
  - **Líneas 70–105:** La sección del *Acceso Rápido Demo (1 Clic)* que permite ingresar al instante como Paciente (`maria@citas.local`), Médico (`ana@citas.local`) o Administrador (`admin@citas.local`).
  - **Líneas 140–215:** El *Panel del Paciente* (resumen de próximas citas y catálogo con filtros de especialidad).
  - **Líneas 220–290:** El *Panel del Médico* (agenda de consultas, estados de citas y acciones para confirmar o completar).
  - **Líneas 295–340:** El *Dashboard del Administrador* (tarjetas de métricas y estadísticas globales).

#### 2. [`CitasMedicas.Web/wwwroot/css/styles.css`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/css/styles.css)
* **¿Qué hace este archivo?**  
  Implementa el sistema de diseño visual corporativo médico. Define variables CSS, paleta de colores HSL (*Medical Blue* `#0284c7`, *Teal* `#0d9488`), tipografía moderna Inter, tarjetas con sombras suaves, badges de estado dinámicos y diseño adaptable a móviles y escritorio.
* **Qué mostrarle al profesor:**
  - **Líneas 1–40:** Las variables CSS globales (`--primary-600`, `--success-500`, `--danger-500`, radios de borde y transiciones suaves).
  - **Clases `.slot-chip` y `.status-badge`:** Los botones interactivos de horarios disponibles y los indicadores visuales de estado de cita (*Pendiente, Confirmada, Completada, Cancelada*).

#### 3. [`CitasMedicas.Web/wwwroot/js/app.js`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/js/app.js)
* **¿Qué hace este archivo?**  
  Es el controlador central de la interfaz. Maneja el estado en memoria (`state`), la navegación entre vistas (`switchView`), el cálculo dinámico de bloques de horarios de 1 hora (`generateHourlySlots`), el renderizado de citas y la gestión de formularios.
* **Qué mostrarle al profesor:**
  - **Función `generateHourlySlots` (línea ~283):** Algoritmo que toma la jornada de un médico (ej. 9:00 a 17:00) y la fragmenta en citas de 60 minutos exactos, descartando automáticamente horarios que ya hayan pasado.
  - **Función `switchView` (línea ~160):** Mecanismo de navegación SPA que oculta y muestra los contenedores según el rol autenticado sin refrescar el navegador.
  - **Función `handleBookingSubmit` (línea ~475):** Envío de la reserva con validación previa de fechas y disponibilidad.

---

### B. Integración con Firebase (Cloud Backend)

#### 4. [`CitasMedicas.Web/wwwroot/js/firebase-config.js`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/js/firebase-config.js)
* **¿Qué hace este archivo?**  
  Contiene las credenciales oficiales del SDK Web de Firebase (API Key, Project ID: `vitalis-care-f0e5e`, Auth Domain y Storage Bucket) y la función `isConfigured()` para verificar el estado de conexión.
* **Qué mostrarle al profesor:**
  - El objeto `firebaseConfig` con la vinculación directa al proyecto de Google Cloud Firebase.

#### 5. [`CitasMedicas.Web/wwwroot/js/firebase-service.js`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/js/firebase-service.js)
* **¿Qué hace este archivo?**  
  Es la capa de servicios que interactúa con **Firebase Authentication** y **Cloud Firestore**. Implementa una arquitectura resiliente dual: opera en tiempo real con Firestore y cuenta con respaldo local para que la aplicación nunca se interrumpa ante fallos de red.
* **Qué mostrarle al profesor:**
  - **Función `fbLogin` (línea ~102):** Inicia sesión con Firebase Auth (`signInWithEmailAndPassword`) y obtiene los datos del perfil desde Firestore. Incluye fallback inteligente para usuarios demo.
  - **Función `fbCreateAppointment` (línea ~210):** Realiza la consulta previa (`where('medicoId', '==', medicoId)`) para verificar que no existan citas solapadas en Firestore antes de guardar la nueva reserva.
  - **Función `fbCancelAppointment` (línea ~320):** Aplica la regla de negocio que prohíbe cancelar citas con menos de 24 horas de antelación.
  - **Función `fbGetAdminStats` (línea ~356):** Agrega métricas globales (total de citas, citas pendientes, completadas, médicos y pacientes registrados).

---

### C. Backend en C# con Clean Architecture (.NET 9)

#### 6. [`CitasMedicas.Domain/Entities/Cita.cs`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Domain/Entities/Cita.cs)
* **¿Qué hace este archivo?**  
  Representa la entidad central del negocio médico en la capa más pura de la arquitectura (sin dependencias de frameworks ni bases de datos).
* **Qué mostrarle al profesor:**
  - Las propiedades `MedicoId`, `PacienteId`, `Inicio`, `Fin`, `Motivo` y el enum `EstadoCita` (*Pendiente, Confirmada, Cancelada, Completada*).

#### 7. [`CitasMedicas.Application/Services/CitaService.cs`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Application/Services/CitaService.cs)
* **¿Qué hace este archivo?**  
  Implementa los casos de uso del sistema y hace cumplir las reglas de negocio antes de persistir cualquier cambio.
* **Qué mostrarle al profesor:**
  - **Regla de fechas futuras:** `if (dto.Inicio <= DateTime.UtcNow) throw new BusinessRuleException("La cita debe ser futura.");`
  - **Regla de no solapamiento:** Comprueba que no exista ninguna cita en el rango `Inicio < c.Fin && Fin > c.Inicio`.
  - **Regla de 24 horas:** `if (cita.Inicio <= DateTime.UtcNow.AddHours(24)) throw new BusinessRuleException("Solo se puede cancelar con 24h de anticipación.");`

#### 8. [`CitasMedicas.Infrastructure/Data/AppDbContext.cs`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Infrastructure/Data/AppDbContext.cs)
* **¿Qué hace este archivo?**  
  Configura Entity Framework Core, los mapeos de relaciones entre tablas (Médicos, Pacientes, Citas, Disponibilidades) y los datos semilla (*Seed Data*).

#### 9. [`CitasMedicas.Web/Controllers/CitasController.cs`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/Controllers/CitasController.cs)
* **¿Qué hace este archivo?**  
  Expone la API RESTful bajo principios HTTP (`POST /api/citas`, `GET /api/citas/paciente/{id}`, `POST /api/citas/{id}/cancelar`), aplicando Inyección de Dependencias del servicio `ICitaService`.

---

### D. Suite Integral de Pruebas de Software (QA: 63 Pruebas Automatizadas)

> 🧪 **Informe Detallado de Calidad:** Puedes abrir y mostrar el informe técnico formal completo en: **[`docs/INFORME_PRUEBAS.md`](docs/INFORME_PRUEBAS.md)**.

#### 10. [`tests/smoke.test.js`](file:///c:/Users/User/Documents/CitasMedicas/tests/smoke.test.js) *(Pruebas de Humo - Smoke Testing)*
* **¿Qué hace este archivo?**  
  Verifica la salud básica e integridad crítica del sistema en milisegundos: valida que existan los archivos estáticos de la SPA, el catálogo semilla de médicos, los 3 roles y la configuración de Firebase.
* **Qué mostrarle al profesor:**
  - El concepto de *Build Verification Testing*: si una prueba de humo falla, no se procede con despliegues.

#### 11. [`tests/acceptance.test.js`](file:///c:/Users/User/Documents/CitasMedicas/tests/acceptance.test.js) *(Pruebas de Aceptación - UAT / BDD)*
* **¿Qué hace este archivo?**  
  Valida las **Historias de Usuario (HU)** bajo formato BDD (*Dado-Cuando-Entonces*):
  - **HU-01:** Paciente reserva turno libre exitosamente.
  - **HU-02:** Rechazo de citas solapadas para el mismo médico.
  - **HU-03:** Médico confirma y completa atención.
  - **HU-04 y HU-05:** Cumplimiento estricto de la regla de cancelación con 24 horas.
  - **HU-06 y HU-07:** Privacidad de datos por paciente y métricas consolidadas de Administrador.

#### 12. [`tests/exploratory.test.js`](file:///c:/Users/User/Documents/CitasMedicas/tests/exploratory.test.js) *(Pruebas Exploratorias - Charters SBTM)*
* **¿Qué hace este archivo?**  
  Ejecuta misiones de exploración de bordes (*Edge Cases*):
  - **Charter 1 (Seguridad):** Neutralización de inyecciones `<script>` (XSS), comandos SQL y contención de textos gigantescos (DoS).
  - **Charter 2 (Fronteras):** Umbral exacto de cancelación (24h + 1s permitida vs 23h 59m 59s rechazada) y cruce de medianoche.
  - **Charter 3 (Concurrencia):** Simulación de condición de carrera con `Promise.all`: dos pacientes compiten por el mismo slot al mismo milisegundo y solo uno gana.

#### 13. [`CitasMedicas.UnitTests/CitaServiceTests.cs`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.UnitTests/CitaServiceTests.cs) *(C# / xUnit)*
* **¿Qué hace este archivo?**  
  Suite de 19 pruebas en C# que aísla la lógica de negocio del backend mediante simulación (*mocking*) de repositorios con Moq.

#### 14. [`run-tests.ps1`](file:///c:/Users/User/Documents/CitasMedicas/run-tests.ps1) y [`run-tests.bat`](file:///c:/Users/User/Documents/CitasMedicas/run-tests.bat)
* **¿Qué hacen estos archivos?**  
  Scripts ejecutores automáticos en un clic. Corren secuencialmente `dotnet test` y todas las suites de JavaScript (Humo, Aceptación, Exploratorias y Unitarias), mostrando las **63 pruebas en verde**.

---

## 🎤 3. Guion Paso a Paso para la Exposición en Vivo

Sigue estos 4 pasos durante tu presentación:

```
[Paso 1: Demostración Web] ➔ [Paso 2: Explicación de Código] ➔ [Paso 3: Arquitectura / Firebase] ➔ [Paso 4: Pruebas Unitarias]
```

### Paso 1: Mostrar la Aplicación Web en el Navegador
1. Abre tu navegador en **`http://localhost:5276/`**.
2. **Rol Paciente:** Haz clic en **María López** en la barra de *Acceso Rápido Demo*.
   - Muestra cómo aparecen sus citas programadas.
   - Selecciona un médico (ej. Dra. Ana García), haz clic en un horario libre (botón `.slot-chip`) y agenda una cita. Verás el mensaje Toast de confirmación.
3. **Rol Médico:** Cierra sesión y haz clic en **Dra. Ana García**.
   - Muestra su agenda del día y cómo puede marcar citas como *Confirmada* o *Completada*.
4. **Rol Administrador:** Cierra sesión y haz clic en **Administrador**.
   - Muestra el cuadro de mando con las métricas en tiempo real (total de citas, pacientes, médicos activos).

### Paso 2: Mostrar el Código del Frontend
- Abre [`app.js`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/js/app.js) y muestra la función `generateHourlySlots` para explicar cómo el sistema genera automáticamente los turnos de atención de cada médico.

### Paso 3: Explicar la Arquitectura y Firebase
- Abre [`firebase-service.js`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Web/wwwroot/js/firebase-service.js) y muestra la función `fbCreateAppointment`.
- Explica: *"Profesor, antes de crear una cita en Firestore, realizamos una consulta para verificar que no haya colisión de horarios con el mismo médico. Además, el servicio cuenta con arquitectura resiliente."*
- Abre [`CitasMedicas.Application/Services/CitaService.cs`](file:///c:/Users/User/Documents/CitasMedicas/CitasMedicas.Application/Services/CitaService.cs) en C# para demostrar que las mismas reglas de negocio están implementadas bajo Clean Architecture.

### Paso 4: Ejecutar las Pruebas Unitarias en Vivo
Abre una terminal en la carpeta del proyecto y corre:

```powershell
.\run-tests.ps1
```
*(O ejecuta `npm test` para JavaScript y `dotnet test` para C#).*

**Lo que debes decir:**
> *"Como se puede observar, el proyecto cuenta con 38 pruebas unitarias automatizadas: 19 pruebas en C# con xUnit y 19 pruebas en JavaScript con Node.js, cubriendo reglas de negocio, integridad de fechas, seguridad XSS y autenticación. Todas pasan al 100% sin ningún error."*

---

## ❓ 4. Posibles Preguntas del Profesor y Cómo Responder

| Pregunta del Profesor | Respuesta Sugerida |
| :--- | :--- |
| **¿Por qué la arquitectura tiene capas separadas?** | *"Para cumplir el principio de inversión de dependencias y responsabilidad única de Clean Architecture. La lógica de negocio (`Domain` y `Application`) es totalmente independiente de la base de datos o del framework web."* |
| **¿Cómo garantizan que dos pacientes no reserven la misma cita?** | *"Tanto en el servicio de C# (`CitaService.cs`) como en el de Firebase (`firebase-service.js`), se valida mediante un filtro de rango de tiempo (`Inicio < c.Fin && Fin > c.Inicio`) que el médico no tenga citas activas previas en ese bloque."* |
| **¿Por qué hay pruebas en JS y en C#?** | *"Para certificar ambos entornos: xUnit evalúa la lógica del backend compilado en .NET 9, mientras que Node.js valida la lógica del cliente y la manipulación de slots y reglas en el frontend."* |
| **¿Cómo manejan la seguridad en el frontend?** | *"En `uiHelpers.test.js` y `app.js` sanitizamos cualquier dato ingresado por el usuario con la función `escapeHtml` para evitar ataques de inyección XSS."* |

---
*Archivo generado para la sustentación académica de Vitalis Care.*
