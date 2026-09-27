# 📽️ GUÍA OPTIMIZADA DE PRESENTACIÓN POWERPOINT (12 DIAPOSITIVAS)
> **Proyecto:** Vitalis Care — Plataforma de Gestión de Citas Médicas  
> **Directriz de Diseño:** Máximo 12 diapositivas, cero saturación de texto, diseño ejecutivo de alto impacto visual y guión verbal conciso para el expositor.

---

### 🖥️ Diapositiva 1: Portada Ejecutiva
- **Título Principal:** Vitalis Care
- **Subtítulo:** Plataforma Integral de Salud Digital y Gestión de Citas Médicas
- **Elementos Visuales:** Logotipo clínico, badges tecnológicos (.NET 9, Vanilla JS, SQLite, Cloudinary).
- **Contenido Clave:**
  - Sistema de alta disponibilidad clínica y concurrencia médica.
  - Autores / Equipo de Desarrollo y Evaluación Académica.
- **🎙️ Guión del Expositor (30s):**
  > *"Buenas tardes, miembros del jurado. Presentamos Vitalis Care, una plataforma médica de última generación diseñada para resolver la ineficiencia en la programación de consultas clínicas a través de Clean Architecture en .NET 9 y una Single Page Application de alto rendimiento."*

---

### 🖥️ Diapositiva 2: El Problema en la Atención Médica
- **Título:** Desafíos en la Gestión Clínica Tradicional
- **Elementos Visuales:** Iconos de alerta y contraste: Reloj (demoras), Cruce de Agendas (errores), Teléfono saturado.
- **Contenido Clave:**
  - **Sobrecupo y solapamiento:** Pérdida de horas médicas por colisiones de horarios.
  - **Cancelaciones imprevistas:** Falta de políticas que mitiguen el ausentismo de pacientes.
  - **Fricción operativa:** Procesos manuales propensos a errores humanos y filtración de datos.
- **🎙️ Guión del Expositor (45s):**
  > *"El principal reto en centros médicos radica en los horarios duplicados y el ausentismo de último minuto. Vitalis Care automatiza la validación en tiempo real, garantizando agendas 100% libres de colisiones y aplicando políticas estrictas de cancelación."*

---

### 🖥️ Diapositiva 3: La Solución Vitalis Care
- **Título:** Ecosistema Médico Digital Resiliente
- **Elementos Visuales:** 3 columnas con tarjetas de usuario: Paciente, Médico, Administrador.
- **Contenido Clave:**
  - **Paciente:** Reserva autónoma en slots exactos de 1 hora y consulta de historial privado.
  - **Médico:** Control de agenda con transición de estados (*Confirmar / Atender*).
  - **Administrador:** Tablero de métricas en tiempo real y supervisión global del centro.
- **🎙️ Guión del Expositor (45s):**
  > *"La solución brinda portales aislados por rol: el paciente autogestiona su cita; el médico controla su consulta en vivo; y la administración visualiza indicadores clínicos y operativos sin demoras."*

---

### 🖥️ Diapositiva 4: Arquitectura del Sistema
- **Título:** Clean Architecture & Enfoque SPA
- **Elementos Visuales:** Diagrama de capas concéntricas (Domain -> Application -> Infrastructure -> Web).
- **Contenido Clave:**
  - **Core de Dominio:** Entidades puras y reglas de negocio agnósticas a la infraestructura.
  - **Application Layer:** Servicios orquestadores (`CitaService`, `UsuarioService`).
  - **Web SPA:** Vanilla JavaScript modular y CSS corporativo sin dependencias pesadas.
  - **Persistencia Híbrida:** SQLite relacional con sincronización multi-dispositivo en tiempo real.
- **🎙️ Guión del Expositor (50s):**
  > *"Estructuramos el sistema bajo Clean Architecture en .NET 9. Esto garantiza que las reglas médicas jamás dependan de librerías externas o bases de datos específicas, permitiendo mantenibilidad y pruebas aisladas al 100%."*

---

### 🖥️ Diapositiva 5: Reglas de Negocio Clínico
- **Título:** Integridad y Seguridad del Acto Médico
- **Elementos Visuales:** Candado de seguridad, cronómetro 24h, división horaria.
- **Contenido Clave:**
  - **Exclusión Mutua de Horarios:** Rechazo atómico de solapamientos para el mismo especialista.
  - **Regla de Cancelación 24h:** Bloqueo preventivo de cancelaciones con menos de un día de anticipación.
  - **Jornadas en Turnos de 60 Minutos:** Fragmentación determinista descartando horarios pasados.
- **🎙️ Guión del Expositor (45s):**
  > *"Nuestras reglas de negocio impiden que dos pacientes ocupen el mismo bloque horario. Además, protegemos el tiempo del especialista exigiendo una anticipación mínima de 24 horas para cualquier cancelación."*

---

### 🖥️ Diapositiva 6: Identidad Médica & Cloudinary
- **Título:** Verificación de Pacientes y Gestión Documental
- **Elementos Visuales:** Fotografía de Cédula de Identidad con badge de subida a la nube.
- **Contenido Clave:**
  - **Validación de Identidad:** Registro obligatorio con Cédula de Identidad física.
  - **Subida Segura:** Integración con Cloudinary mediante *Unsigned Upload Preset*.
  - **Desacoplamiento:** Almacenamiento optimizado de URLs seguras (`https`) sin saturar la base de datos.
- **🎙️ Guión del Expositor (40s):**
  > *"Para dotar de realismo clínico al sistema, exigimos el documento de identidad en el alta del paciente. Los archivos físicos se transfieren directamente a Cloudinary mediante un preset firmado, almacenando únicamente su URL auditada."*

---

### 🖥️ Diapositiva 7: Repositorio Seguro & Cero Credenciales
- **Título:** Seguridad de Infraestructura y Gestión de Secretos
- **Elementos Visuales:** Candado Git, variables de entorno, archivo .gitignore blindado.
- **Contenido Clave:**
  - **`appsettings.json` Limpio:** Sin contraseñas, tokens de API ni credenciales expuestas en Git.
  - **User Secrets & Variables de Entorno:** Configuración protegida fuera del árbol de control de versiones.
  - **Data Protection:** Cifrado de cookies de autenticación con `SameSite=Strict` y `HttpOnly`.
- **🎙️ Guión del Expositor (40s):**
  > *"Cumpliendo con los estándares de ciberseguridad, nuestro repositorio Git no aloja ninguna credencial en texto claro. El entorno productivo se nutre de User Secrets y Variables de Entorno con aislamiento estricto."*

---

### 🖥️ Diapositiva 8: Estrategia de Pruebas de Software (QA)
- **Título:** Pirámide de Calidad Automatizada
- **Elementos Visuales:** Pirámide de pruebas (Unitarias -> Humo -> Integración -> BDD -> Exploratorias).
- **Contenido Clave:**
  - **35 Pruebas en .NET 9 (`dotnet test`):** 19 Unitarias + 4 Humo + 5 Integración + 7 BDD.
  - **44 Pruebas en Node.js (`npm test`):** Validaciones frontales y helpers.
  - **Tasa de Aprobación:** **100% en VERDE**, sin excepciones ni pruebas omitidas.
- **🎙️ Guión del Expositor (45s):**
  > *"Garantizamos la estabilidad con una estrategia de pruebas integral. Ejecutamos 35 pruebas automatizadas nativas en .NET 9 y 44 en JavaScript, alcanzando un 100% de éxito verde continuo."*

---

### 🖥️ Diapositiva 9: Pruebas BDD (Historias de Usuario HU-01 a HU-07)
- **Título:** Behavior-Driven Development (Dado / Cuando / Entonces)
- **Elementos Visuales:** Tabla de historias de usuario con checks de aprobación verde.
- **Contenido Clave:**
  - **HU-01:** Reserva exitosa en horario libre.
  - **HU-02:** Rechazo automático de reserva solapada.
  - **HU-03:** Transición de estados por el facultativo (*Pendiente -> Confirmada -> Completada*).
  - **HU-04 / HU-05:** Validación de políticas de cancelación (+24h permitida / -24h rechazada).
  - **HU-06 / HU-07:** Privacidad de datos médicos y consolidación precisa de métricas en dashboard.
- **🎙️ Guión del Expositor (50s):**
  > *"Nuestros escenarios BDD verifican el comportamiento exacto desde la óptica del usuario clínico, comprobando que las historias de usuario de pacientes, doctores y administradores se cumplan a cabalidad."*

---

### 🖥️ Diapositiva 10: Pruebas de Rendimiento con NBomber
- **Título:** Evaluación de Carga y Concurrencia Extrema
- **Elementos Visuales:** Gráfico de métricas y velocímetro de throughput.
- **Contenido Clave:**
  - **157,621 solicitudes procesadas** con **0.00% de tasa de fallos**.
  - **24,264 req/s** en monitoreo de estado del sistema (Latencia P95: 4.46 ms).
  - **1,893 req/s** en consulta a base de datos de especialistas médicos.
  - **513.5 MB de transferencia** en replicación de estado sin degradación de memoria.
- **🎙️ Guión del Expositor (50s):**
  > *"Sometimos el backend a estrés con NBomber 6.6. La plataforma procesó más de 157,000 peticiones con un 0% de error, manteniendo latencias inferiores a 5 milisegundos en el 95% de las solicitudes."*

---

### 🖥️ Diapositiva 11: Bitácora de Pruebas Exploratorias (SBTM)
- **Título:** Sesiones de Exploración y Seguridad Firmadas
- **Elementos Visuales:** Sello de aprobación "FIRMADO" y resumen de los 4 Charters.
- **Contenido Clave:**
  - **Charter 1 (Seguridad):** Inyección XSS, caracteres SQL y null bytes neutralizados.
  - **Charter 2 (Fronteras):** Cancelación a 24h + 1s permitida y 24h - 1s bloqueada.
  - **Charter 3 (Concurrencia):** Doble reserva simultánea resuelta con exclusión mutua (409 Conflict).
  - **Charter 4 (Fuzzing):** Nombres internacionales, diéresis y emojis soportados en UTF-8.
- **🎙️ Guión del Expositor (45s):**
  > *"Complementamos la automatización con pruebas exploratorias basadas en sesiones (SBTM), auditando ataques de inyección, condiciones de carrera y fronteras temporales, debidamente certificadas en la bitácora formal."*

---

### 🖥️ Diapositiva 12: Demostración en Vivo & Conclusiones
- **Título:** Conclusiones y Demostración Operativa
- **Elementos Visuales:** Captura de la interfaz de Vitalis Care en múltiples dispositivos (PC y móvil).
- **Contenido Clave:**
  - Plataforma lista para despliegue y sustentación final.
  - Código fuente limpio, desacoplado y completamente documentado.
  - *Demostración en vivo de reserva, verificación de identidad y panel de control.*
- **🎙️ Guión del Expositor (35s):**
  > *"Vitalis Care demuestra que es posible combinar una experiencia de usuario ágil y moderna con la robustez y seguridad de .NET 9. Pasamos ahora a la demostración en vivo del sistema. Muchas gracias."*
