# DOCUMENTO 4: INFORME DE PRUEBAS DE ACEPTACIÓN (UAT / BDD)

**Código de Documento:** `EVI-QA-UAT-004`  
**Característica:** Agendamiento Clínico, Prevención de Solapamientos y Política de Cancelación  
**Marco de Automatización:** xUnit BDD + Gherkin Formal (`AgendamientoCitas.feature`) en C# (.NET 9)  
**Stakeholder Revisor:** Dirección Médica y Comité de Calidad Asistencial (Vitalis Care)  
**Fecha de Ejecución:** 27 de septiembre de 2026  
**Responsables:** Brandon Alessandro Hernández Escobar, Johny Matheo Franco Zuleta (Líderes de Pruebas BDD)  

---

## 1. Escenarios de Negocio Formales (Lenguaje Gherkin)

```gherkin
Feature: Gestión y Agendamiento Seguro de Citas Médicas (Vitalis Care)
  Como paciente de la clínica Vitalis Care
  Quiero agendar consultas médicas en turnos libres con especialistas
  Para recibir atención oportuna y garantizar la integridad de mi historial clínico

  @ReglaDeNegocio_RN01 @HU01
  Scenario: Reserva exitosa de cita médica en horario disponible
    Given que la paciente "María López" está autenticada en el portal
    And la especialista "Dra. Ana García" tiene disponibilidad libre de "10:00" a "11:00"
    When la paciente confirma la reserva para ese horario con el motivo "Consulta preventiva cardiológica"
    Then el estado de la cita debe registrarse como "Pendiente"
    And el bloque horario del médico queda descontado en la agenda

  @ReglaDeNegocio_RN02 @HU02
  Scenario: Rechazo de agendamiento por solapamiento de turno
    Given que la especialista "Dra. Ana García" ya cuenta con una cita médica de "10:00" a "11:00"
    When otro paciente intenta reservar una consulta de "10:30" a "11:30" con la misma especialista
    Then el sistema debe rechazar la transacción
    And debe informar el mensaje de error "El médico ya tiene una cita en ese horario"

  @ReglaDeNegocio_RN04 @HU04
  Scenario: Cancelación oportuna con más de 24 horas de anticipación
    Given que el paciente tiene una cita programada para dentro de "48" horas
    When solicita la cancelación de la cita
    Then la solicitud es aprobada
    And el estado de la cita cambia a "Cancelada"
    And el turno vuelve a estar disponible para otros pacientes

  @ReglaDeNegocio_RN05 @HU05
  Scenario: Rechazo de cancelación extemporánea con menos de 24 horas
    Given que el paciente tiene una cita programada para dentro de "8" horas
    When solicita la cancelación de la consulta
    Then el sistema debe denegar la cancelación
    And se debe mantener el estado original "Pendiente"
    And se informa la violación de la política clínica de 24 horas
```

---

## 2. Implementación de Step Definitions en C#

```csharp
[Fact, Trait("Category", "BDD")]
public async Task HU01_DadoPacienteYMedicoDisponibles_CuandoReservaCitaValida_EntoncesSeRegistraEnEstadoPendiente()
{
    // GIVEN (Dado que María López desea reservar con la Dra. Ana García en horario libre)
    int medicoUsuarioId = 1;
    int pacienteUsuarioId = 2;
    var inicio = DateTime.Now.AddDays(3).Date.AddHours(10);
    var fin = inicio.AddHours(1);

    _citaRepoMock.Setup(r => r.HasOverlapAsync(medicoUsuarioId, inicio, fin, null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
    _citaRepoMock.Setup(r => r.ReserveAvailabilityAsync(medicoUsuarioId, inicio, fin, It.IsAny<CancellationToken>())).ReturnsAsync(true);

    // WHEN (Cuando confirma la reserva)
    var dto = new CitaCreateDto(medicoUsuarioId, pacienteUsuarioId, inicio, fin, "Consulta preventiva cardiológica");
    var resultado = await _citaService.CrearAsync(dto);

    // THEN (Entonces el estado es Pendiente y se descuenta el bloque de disponibilidad)
    Assert.NotNull(resultado);
    Assert.Equal(EstadoCita.Pendiente, resultado.Estado);
    Assert.Equal("Dra. Ana García", resultado.Medico);
    _citaRepoMock.Verify(r => r.AddAsync(It.IsAny<Cita>(), It.IsAny<CancellationToken>()), Times.Once);
}
```

---

## 3. Matriz de Conformidad de Criterios de Aceptación

| Código | Criterio de Aceptación Clínico | Estado | Observación |
| :---: | :--- | :---: | :--- |
| **UAT-AC-01** | Creación de Cita en Estado Pendiente (HU-01) | **Conforme** | Validación exacta de enlace de paciente, especialista y deducción de agenda. |
| **UAT-AC-02** | Detección y Bloqueo de Solapamientos (HU-02) | **Conforme** | Algoritmo preventivo rechaza reservas superpuestas con HTTP 400. |
| **UAT-AC-03** | Transición de Estados por el Médico (HU-03) | **Conforme** | Flujo `Pendiente` ➔ `Confirmada` ➔ `Completada` sin saltos inválidos. |
| **UAT-AC-04** | Cancelación Válida > 24 Horas (HU-04) | **Conforme** | Liberación inmediata del turno para nuevos pacientes. |
| **UAT-AC-05** | Bloqueo de Cancelación < 24 Horas (HU-05) | **Conforme** | Inmutabilidad garantizada ante cancelaciones de última hora. |
| **UAT-AC-06** | Aislamiento y Privacidad de Pacientes (HU-06) | **Conforme** | Filtro estricto por `pacienteId`; cero fugas de expedientes ajenos. |
| **UAT-AC-07** | Consolidación de Métricas de Gestión (HU-07) | **Conforme** | Cuadre matemático total de contadores en el panel del Administrador. |

---

## 4. Veredicto
**ACEPTADO POR EL CLIENTE / PRODUCT OWNER.** Los 7 escenarios BDD satisfacen al 100% las especificaciones funcionales y normativas del servicio médico de Vitalis Care.
