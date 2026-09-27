# 📊 DIAGRAMAS UML Y DE ARQUITECTURA: VITALIS CARE
> **Plataforma Integral de Gestión de Citas Médicas y Salud Digital**  
> *Documentación visual y formal para sustentación académica ante jurados y profesores.*

---

## 📑 Índice de Diagramas
1. [Diagrama 1: Casos de Uso del Sistema (UML Use Case Diagram)](#1-diagrama-de-casos-de-uso-uml-use-case-diagram)
2. [Diagrama 2: Clases y Dominio (UML Class Diagram)](#2-diagrama-de-clases-del-dominio-uml-class-diagram)
3. [Diagrama 3: Secuencia — Flujo de Agendamiento de Cita con Validación de Solapamiento](#3-diagrama-de-secuencia--reserva-de-cita-médica)
4. [Diagrama 4: Secuencia — Cancelación de Cita con Regla de 24 Horas](#4-diagrama-de-secuencia--cancelación-de-cita-regla-de-24-horas)
5. [Diagrama 5: Máquina de Estados del Ciclo de Vida de una Cita](#5-diagrama-de-estados-ciclo-de-vida-de-la-cita-médica)
6. [Diagrama 6: Arquitectura de Software (Clean Architecture + Firebase Cloud)](#6-diagrama-de-arquitectura-de-software-clean-architecture--firebase)
7. [Diagrama 7: Modelo Entidad-Relación (DER / Base de Datos)](#7-diagrama-entidad-relación-der--modelo-de-datos)

---

## 1. Diagrama de Casos de Uso (UML Use Case Diagram)

Describe las interacciones de los tres actores del sistema (**Paciente**, **Médico** y **Administrador**) con las funcionalidades y reglas de negocio del sistema.

```mermaid
flowchart LR
    %% Actores
    subgraph Actores["Actores del Sistema"]
        P((👤 Paciente))
        M((🩺 Médico))
        A((🛡️ Administrador))
    end

    %% Sistema
    subgraph VitalisCare["Sistema Vitalis Care"]
        UC1([Iniciar Sesión / Autenticarse])
        UC2([Registrar Nueva Cuenta de Paciente])
        UC3([Consultar Catálogo de Especialistas])
        UC4([Seleccionar Turno Horario])
        UC5([Agendar Cita Médica])
        UC6([Validar No Solapamiento])
        UC7([Consultar Historial de Citas])
        UC8([Cancelar Cita Médica])
        UC9([Validar Anticipación > 24 Horas])
        UC10([Visualizar Agenda Diaria])
        UC11([Confirmar / Atender Cita])
        UC12([Gestionar Horarios de Disponibilidad])
        UC13([Visualizar Tablero de Estadísticas])
        UC14([Administrar Usuarios y Médicos])
    end

    %% Relaciones Paciente
    P --> UC1
    P --> UC2
    P --> UC3
    P --> UC4
    P --> UC5
    P --> UC7
    P --> UC8

    %% Relaciones Médico
    M --> UC1
    M --> UC10
    M --> UC11
    M --> UC12

    %% Relaciones Administrador
    A --> UC1
    A --> UC13
    A --> UC14

    %% Relaciones Include / Extend
    UC5 -.->|<<include>>| UC6
    UC8 -.->|<<include>>| UC9
```

> **Explicación para el jurado:**
> - El caso de uso **Agendar Cita** tiene un vínculo `<<include>>` con **Validar No Solapamiento**, garantizando que ninguna cita sea persistida si el médico ya tiene un compromiso en ese bloque.
> - El caso de uso **Cancelar Cita** incluye obligatoriamente la regla de negocio de **Anticipación de 24 Horas**.

---

## 2. Diagrama de Clases del Dominio (UML Class Diagram)

Representa las entidades del modelo de dominio, sus atributos tipados, métodos y multiplicidad de relaciones bajo principios de orientación a objetos y Clean Architecture.

```mermaid
classDiagram
    direction TB

    class RolUsuario {
        <<enumeration>>
        Paciente
        Medico
        Admin
    }

    class EstadoCita {
        <<enumeration>>
        Pendiente
        Confirmada
        Cancelada
        Completada
    }

    class Usuario {
        +int Id
        +string NombreCompleto
        +string Email
        +string PasswordHash
        +RolUsuario Rol
        +DateTime CreadoEn
        +bool ValidarPassword(string password)
    }

    class Paciente {
        +int Id
        +int UsuarioId
        +DateTime FechaNacimiento
        +string Telefono
        +Usuario Usuario
        +List~Cita~ Citas
        +int CalcularEdad()
    }

    class Medico {
        +int Id
        +int UsuarioId
        +string Especialidad
        +string NumeroLicencia
        +Usuario Usuario
        +List~Disponibilidad~ Disponibilidades
        +List~Cita~ Citas
        +bool TieneConflicto(DateTime inicio, DateTime fin)
    }

    class Disponibilidad {
        +int Id
        +int MedicoId
        +DateTime Inicio
        +DateTime Fin
        +bool Disponible
        +Medico Medico
    }

    class Cita {
        +int Id
        +int MedicoId
        +int PacienteId
        +DateTime Inicio
        +DateTime Fin
        +string Motivo
        +EstadoCita Estado
        +DateTime FechaCreacion
        +Medico Medico
        +Paciente Paciente
        +bool PuedeCancelarse()
        +void Confirmar()
        +void Completar()
        +void Cancelar()
    }

    %% Relaciones
    Usuario "1" <-- "1" Paciente : asociado a
    Usuario "1" <-- "1" Medico : asociado a
    Usuario ..> RolUsuario : usa
    Medico "1" *-- "0..*" Disponibilidad : compone
    Medico "1" o-- "0..*" Cita : atiende
    Paciente "1" o-- "0..*" Cita : solicita
    Cita ..> EstadoCita : posee
```

> **Explicación para el jurado:**
> - Se aplica el patrón de desacoplamiento entre cuenta de acceso (`Usuario`) y perfiles clínicos (`Paciente`, `Medico`).
> - La clase `Cita` encapsula métodos de negocio (`PuedeCancelarse()`, `Confirmar()`, `Cancelar()`) garantizando que el dominio proteja sus invariantes.

---

## 3. Diagrama de Secuencia — Reserva de Cita Médica

Modela la interacción paso a paso cuando un paciente reserva un horario libre, detallando las validaciones preventivas de solapamiento.

```mermaid
sequenceDiagram
    autonumber
    actor P as 👤 Paciente
    participant UI as 🖥️ Interfaz SPA (app.js)
    participant FS as ⚡ Firebase / CitaService
    participant DB as 🗄️ Firestore / SQLite DB

    P->>UI: Selecciona Especialista y Horario libre (ej: 10:00 - 11:00)
    P->>UI: Ingresa Motivo de consulta y presiona "Confirmar y Reservar"
    
    activate UI
    UI->>UI: Valida fecha futura (inicio > fechaActual)
    
    UI->>FS: fbCreateAppointment({ medicoId, pacienteId, inicio, fin, motivo })
    activate FS
    
    FS->>DB: Consultar citas activas del médico en esa fecha
    activate DB
    DB-->>FS: Lista de citas agendadas
    deactivate DB
    
    alt ¿Existe Solapamiento de Horario? (inicio < c.Fin && fin > c.Inicio)
        FS-->>UI: Error: "El médico ya tiene una cita agendada en ese horario"
        UI-->>P: Muestra Toast de Alerta Roja (Reserva rechazada)
    else Horario Libre y Confirmado
        FS->>DB: addDoc("citas", { estado: "Pendiente", inicio, fin, ... })
        activate DB
        DB-->>FS: ID generado (ej: "cita-9874")
        deactivate DB
        
        FS-->>UI: Retorna Cita Creada Exitosamente
        deactivate FS
        
        UI->>UI: Actualiza estado local y re-renderiza tarjetas de citas
        UI-->>P: Muestra Toast Verde: "¡Cita reservada con éxito!"
    end
    deactivate UI
```

---

## 4. Diagrama de Secuencia — Cancelación de Cita (Regla de 24 Horas)

Demuestra cómo el sistema evalúa la regla de negocio que prohíbe cancelaciones tardías.

```mermaid
sequenceDiagram
    autonumber
    actor P as 👤 Paciente
    participant UI as 🖥️ Interfaz SPA (app.js)
    participant CS as ⚖️ Regla de Negocio (24h)
    participant DB as 🗄️ Base de Datos

    P->>UI: Clic en botón "Cancelar Cita"
    activate UI
    UI->>CS: fbCancelAppointment(citaId)
    activate CS
    
    CS->>DB: Obtener datos de la cita por Id
    activate DB
    DB-->>CS: Datos de Cita (Inicio, Estado)
    deactivate DB
    
    alt Cita ya está en estado 'Cancelada' o 'Completada'
        CS-->>UI: Error: "La cita no puede cancelarse en su estado actual"
        UI-->>P: Toast Error (Acción inválida)
    else Cita con menos de 24 horas (inicio <= now + 24 horas)
        CS-->>UI: Error: "La cancelación debe hacerse con al menos 24 horas de anticipación"
        UI-->>P: Toast Advertencia: Bloqueo de política médica
    else Cumple política (> 24 horas de anticipación)
        CS->>DB: updateDoc("citas", { estado: "Cancelada" })
        activate DB
        DB-->>CS: Confirmación de actualización
        deactivate DB
        CS-->>UI: Operación Exitosa
        deactivate CS
        UI->>UI: Remueve cita de la lista activa
        UI-->>P: Toast Verde: "Cita cancelada correctamente"
    end
    deactivate UI
```

---

## 5. Diagrama de Estados: Ciclo de Vida de la Cita Médica

Modela la máquina de estados finitos que gobierna las transiciones legales e ilegales de una cita médica.

```mermaid
stateDiagram-v2
    [*] --> Pendiente : Paciente reserva turno disponible

    state Pendiente {
        [*] --> EnEsperaDeConfirmacion
    }

    Pendiente --> Confirmada : Médico o Administrador aprueba la cita
    Pendiente --> Cancelada : Paciente o Médico cancela (con > 24h)

    Confirmada --> Completada : Médico finaliza la atención médica
    Confirmada --> Cancelada : Cancelación excepcional (con > 24h)

    Completada --> [*] : Cita cerrada con registro clínico
    Cancelada --> [*] : Cita anulada (horario liberado)

    %% Restricciones
    note right of Cancelada
        Estado Terminal:
        Prohibido reactivar
        o modificar.
    end note

    note right of Completada
        Estado Terminal:
        Auditoría médica
        inmutable.
    end note
```

---

## 6. Diagrama de Arquitectura de Software (Clean Architecture + Firebase)

Ilustra la estructura desacoplada del sistema: el cliente frontend (SPA), el motor en la nube con Firebase y la API N-Tier en C# .NET 9.

```mermaid
flowchart TB
    subgraph CLIENTE["🌐 Capa Cliente (Frontend SPA)"]
        UI["Interfaz Web (HTML5 / CSS3 / Vanilla JS)"]
        APP["Controlador Cliente (app.js)"]
        FBC["Configuración Firebase (firebase-config.js)"]
        FBS["Servicio Resiliente Dual (firebase-service.js)"]
        
        UI --> APP
        APP --> FBS
        FBS --> FBC
    end

    subgraph CLOUD["☁️ Google Cloud / Firebase Services"]
        AUTH["Firebase Authentication (Usuarios y Tokens JWT)"]
        FIRESTORE[("Cloud Firestore (Base de Datos NoSQL en Tiempo Real)")]
        HOSTING["Firebase Hosting (Despliegue Global HTTPS)"]
        
        FBS -->|Auth SDK v10| AUTH
        FBS -->|CRUD NoSQL| FIRESTORE
    end

    subgraph BACKEND["🛡️ Backend .NET 9 (Clean Architecture)"]
        direction TB
        subgraph WEB_LAYER["Capa Web / Presentación"]
            CTRL["Controladores REST API (CitasController, AuthController)"]
        end

        subgraph APP_LAYER["Capa Aplicación (Application)"]
            SRV["Servicios de Negocio (CitaService, UsuarioService)"]
            DTO["Data Transfer Objects (DTOs)"]
            INT["Interfaces de Repositorio"]
        end

        subgraph DOM_LAYER["Capa Dominio (Domain)"]
            ENT["Entidades (Cita, Medico, Paciente, Usuario)"]
            ENM["Enums (EstadoCita, RolUsuario)"]
        end

        subgraph INFRA_LAYER["Capa Infraestructura (Infrastructure)"]
            REPO["Implementación de Repositorios"]
            EF["Entity Framework Core (AppDbContext)"]
            SQLITE[("Base de Datos Local SQLite")]
        end

        CTRL --> SRV
        SRV --> DTO
        SRV --> INT
        SRV --> ENT
        REPO -.->|Implementa| INT
        REPO --> EF
        EF --> SQLITE
    end

    subgraph QA["🧪 Suite de Pruebas Unitarias (Testing)"]
        TEST_JS["19 Pruebas en JavaScript (Node.js Test Runner)"]
        TEST_CS["19 Pruebas en C# (xUnit + Moq)"]
    end
```

---

## 7. Diagrama Entidad-Relación (DER / Modelo de Datos)

Modela la estructura de tablas relacionales (SQLite / EF Core) y colecciones equivalentes en Firestore.

```mermaid
erDiagram
    USUARIOS ||--o| PACIENTES : "perfil paciente"
    USUARIOS ||--o| MEDICOS : "perfil medico"
    MEDICOS ||--o{ DISPONIBILIDADES : "programa"
    MEDICOS ||--o{ CITAS : "atiende"
    PACIENTES ||--o{ CITAS : "solicita"

    USUARIOS {
        int Id PK
        string NombreCompleto
        string Email UK
        string PasswordHash
        string Rol
        datetime CreadoEn
    }

    PACIENTES {
        int Id PK
        int UsuarioId FK
        datetime FechaNacimiento
        string Telefono
    }

    MEDICOS {
        int Id PK
        int UsuarioId FK
        string Especialidad
        string NumeroLicencia UK
    }

    DISPONIBILIDADES {
        int Id PK
        int MedicoId FK
        datetime Inicio
        datetime Fin
        bool Disponible
    }

    CITAS {
        int Id PK
        int MedicoId FK
        int PacienteId FK
        datetime Inicio
        datetime Fin
        string Motivo
        string Estado
        datetime FechaCreacion
    }
```

---

## 💡 Guía Rápida para el Expositor: Cómo Explicar los Diagramas

| Diagrama | Qué responder si el profesor pregunta |
| :--- | :--- |
| **Casos de Uso** | *"Muestra los 3 roles del sistema y destaca que tanto la verificación de no solapamiento como la regla de cancelación de 24h son obligatorias mediante relaciones `<<include>>`."* |
| **Diagrama de Clases** | *"Evidencia el desacoplamiento: las entidades de dominio son ricas en lógica de negocio y están libres de dependencias de bases de datos o frameworks."* |
| **Secuencia de Reserva** | *"Explica cómo el sistema consulta la disponibilidad antes de confirmar, evitando que dos pacientes ocupen el mismo horario simultáneamente."* |
| **Máquina de Estados** | *"Demuestra que los estados 'Cancelada' y 'Completada' son terminales; el sistema impide reactivar citas canceladas para mantener la integridad histórica médica."* |
| **Arquitectura** | *"Muestra cómo conviven la API Clean Architecture en .NET 9 con el servicio en la nube de Firebase, respaldado por 38 pruebas unitarias automatizadas."* |

---
*Documento técnico de soporte arquitectónico para Vitalis Care.*
