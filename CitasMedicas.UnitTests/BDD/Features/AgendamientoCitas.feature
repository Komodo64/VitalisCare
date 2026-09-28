# language: es
Característica: Gestión y Agendamiento Seguro de Citas Médicas (Vitalis Care)
  Como paciente de la clínica Vitalis Care
  Quiero agendar consultas médicas en turnos libres con especialistas
  Para recibir atención oportuna y garantizar la integridad de mi historial clínico

  @ReglaDeNegocio_RN01 @HU01
  Escenario: Reserva exitosa de cita médica en horario disponible
    Dado que la paciente "María López" está autenticada en el portal
    Y la especialista "Dra. Ana García" tiene disponibilidad libre de "10:00" a "11:00"
    Cuando la paciente confirma la reserva para ese horario con el motivo "Consulta preventiva cardiológica"
    Entonces el estado de la cita debe registrarse como "Pendiente"
    Y el bloque horario del médico queda descontado en la agenda

  @ReglaDeNegocio_RN02 @HU02
  Escenario: Rechazo de agendamiento por solapamiento de turno
    Dado que la especialista "Dra. Ana García" ya cuenta con una cita médica de "10:00" a "11:00"
    Cuando otro paciente intenta reservar una consulta de "10:30" a "11:30" con la misma especialista
    Entonces el sistema debe rechazar la transacción
    Y debe informar el mensaje de error "El médico ya tiene una cita en ese horario"

  @ReglaDeNegocio_RN03 @HU03
  Escenario: Transición de estados de atención por el médico tratante
    Dado que existe una cita médica en estado "Pendiente"
    Cuando el médico confirma la asistencia del paciente
    Entonces el estado de la cita transiciona a "Confirmada"
    Y al concluir la consulta médica el estado finaliza en "Completada"

  @ReglaDeNegocio_RN04 @HU04
  Escenario: Cancelación oportuna con más de 24 horas de anticipación
    Dado que el paciente tiene una cita programada para dentro de "48" horas
    Cuando solicita la cancelación de la cita
    Entonces la solicitud es aprobada
    Y el estado de la cita cambia a "Cancelada"
    Y el turno vuelve a estar disponible para otros pacientes

  @ReglaDeNegocio_RN05 @HU05
  Escenario: Rechazo de cancelación extemporánea con menos de 24 horas
    Dado que el paciente tiene una cita programada para dentro de "8" horas
    Cuando solicita la cancelación de la consulta
    Entonces el sistema debe denegar la cancelación
    Y se debe mantener el estado original "Pendiente"
    Y se informa la violación de la política clínica de 24 horas

  @ReglaDeNegocio_RN06 @HU06
  Escenario: Privacidad y aislamiento estricto de expedientes entre pacientes
    Dado que existen múltiples consultas de diferentes pacientes en la base de datos
    Cuando la paciente "María López" consulta su historial
    Entonces únicamente se retornan las citas vinculadas a su identificador de paciente
    Y no se expone ningún registro perteneciente a terceros

  @ReglaDeNegocio_RN07 @HU07
  Escenario: Consolidación matemática exacta del tablero administrativo
    Dado que el sistema registra consultas en estados "Pendiente", "Confirmada", "Completada" y "Cancelada"
    Cuando el Administrador consulta las métricas del panel de control
    Entonces el total general y los subtotales por estado coinciden con exactitud matemática
