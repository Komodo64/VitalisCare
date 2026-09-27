namespace CitasMedicas.UnitTests.BDD;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Services;
using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;
using Moq;
using Xunit;

/// <summary>
/// SUITE DE PRUEBAS BDD (BEHAVIOR-DRIVEN DEVELOPMENT) - VITALIS CARE
/// Estructura formal: Dado que (Given) -> Cuando (When) -> Entonces (Then)
/// Historias de Usuario: HU-01 a HU-07
/// </summary>
public class BddScenariosTests
{
    private readonly Mock<ICitaRepository> _citaRepoMock = new();
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
    private readonly Mock<IDashboardRepository> _dashboardRepoMock = new();
    private readonly CitaService _citaService;
    private readonly DashboardService _dashboardService;

    public BddScenariosTests()
    {
        _citaService = new CitaService(_citaRepoMock.Object, _usuarioRepoMock.Object);
        _dashboardService = new DashboardService(_dashboardRepoMock.Object);
    }

    [Fact]
    public async Task HU01_DadoPacienteYMedicoDisponibles_CuandoReservaCitaValida_EntoncesSeRegistraEnEstadoPendiente()
    {
        // GIVEN (Dado que María López desea reservar consulta con la Dra. Ana García)
        int medicoUsuarioId = 1;
        int pacienteUsuarioId = 2;
        var inicio = DateTime.Now.AddDays(3).Date.AddHours(10);
        var fin = inicio.AddHours(1);

        var medico = new Medico { Id = 10, UsuarioId = medicoUsuarioId, Especialidad = "Cardiología", Usuario = new Usuario { NombreCompleto = "Dra. Ana García", Email = "ana@vitalis.local", PasswordHash = "x" } };
        var paciente = new Paciente { Id = 20, UsuarioId = pacienteUsuarioId, NumeroDocumento = "1712345678", Usuario = new Usuario { NombreCompleto = "María López", Email = "maria@vitalis.local", PasswordHash = "x" } };

        _citaRepoMock.Setup(r => r.HasOverlapAsync(medicoUsuarioId, inicio, fin, null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _citaRepoMock.Setup(r => r.ReserveAvailabilityAsync(medicoUsuarioId, inicio, fin, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _usuarioRepoMock.Setup(r => r.GetMedicoByUsuarioIdAsync(medicoUsuarioId, It.IsAny<CancellationToken>())).ReturnsAsync(medico);
        _usuarioRepoMock.Setup(r => r.GetPacienteByUsuarioIdAsync(pacienteUsuarioId, It.IsAny<CancellationToken>())).ReturnsAsync(paciente);
        _citaRepoMock.Setup(r => r.AddAsync(It.IsAny<Cita>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _citaRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var dto = new CitaCreateDto(medicoUsuarioId, pacienteUsuarioId, inicio, fin, "Consulta preventiva cardiológica");

        // WHEN (Cuando solicita la reserva)
        var resultado = await _citaService.CrearAsync(dto);

        // THEN (Entonces la cita se registra en estado Pendiente con los nombres correspondientes)
        Assert.NotNull(resultado);
        Assert.Equal(EstadoCita.Pendiente, resultado.Estado);
        Assert.Equal("Dra. Ana García", resultado.Medico);
        Assert.Equal("María López", resultado.Paciente);
        _citaRepoMock.Verify(r => r.AddAsync(It.Is<Cita>(c => c.Estado == EstadoCita.Pendiente && c.Motivo == "Consulta preventiva cardiológica"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HU02_DadoHorarioYaOcupado_CuandoOtroPacienteIntentaReservar_EntoncesSeRechazaPorSolapamiento()
    {
        // GIVEN (Dado que la especialista ya tiene una cita de 10:00 a 11:00)
        int medicoUsuarioId = 1;
        var inicio = DateTime.Now.AddDays(2).Date.AddHours(10);
        var fin = inicio.AddHours(1);

        _citaRepoMock.Setup(r => r.HasOverlapAsync(medicoUsuarioId, inicio, fin, null, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(true);

        var dto = new CitaCreateDto(medicoUsuarioId, 2, inicio, fin, "Intento en horario ocupado");

        // WHEN & THEN (Cuando otro paciente intenta agendar en ese intervalo, el sistema lanza InvalidOperationException)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _citaService.CrearAsync(dto));
        Assert.Contains("El médico ya tiene una cita en ese horario", ex.Message);
    }

    [Fact]
    public async Task HU03_DadoCitaPendiente_CuandoMedicoConfirmaYCompleta_EntoncesTransicionaCorrectamente()
    {
        // GIVEN (Dado una cita pendiente asignada al médico)
        int citaId = 101;
        var cita = new Cita
        {
            Id = citaId,
            MedicoId = 10,
            PacienteId = 20,
            Inicio = DateTime.Now.AddDays(1),
            Fin = DateTime.Now.AddDays(1).AddHours(1),
            Estado = EstadoCita.Pendiente
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(citaId, It.IsAny<CancellationToken>())).ReturnsAsync(cita);
        _citaRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        // WHEN (El médico confirma la cita)
        await _citaService.CambiarEstadoAsync(citaId, EstadoCita.Confirmada);

        // THEN (El estado es Confirmada)
        Assert.Equal(EstadoCita.Confirmada, cita.Estado);

        // WHEN (El médico finaliza la atención)
        await _citaService.CambiarEstadoAsync(citaId, EstadoCita.Completada);

        // THEN (El estado es Completada)
        Assert.Equal(EstadoCita.Completada, cita.Estado);
    }

    [Fact]
    public async Task HU04_DadoCitaConMasDe24HorasDeAnticipacion_CuandoPacienteCancela_EntoncesCancelacionEsAceptada()
    {
        // GIVEN (Dado una cita programada para dentro de 48 horas)
        int citaId = 202;
        var cita = new Cita
        {
            Id = citaId,
            Inicio = DateTime.Now.AddHours(48),
            Fin = DateTime.Now.AddHours(49),
            Estado = EstadoCita.Pendiente
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(citaId, It.IsAny<CancellationToken>())).ReturnsAsync(cita);
        _citaRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        // WHEN (Cuando el paciente solicita la cancelación)
        await _citaService.CancelarAsync(citaId);

        // THEN (La cita pasa a estado Cancelada)
        Assert.Equal(EstadoCita.Cancelada, cita.Estado);
        _citaRepoMock.Verify(r => r.Update(It.Is<Cita>(c => c.Estado == EstadoCita.Cancelada)), Times.Once);
    }

    [Fact]
    public async Task HU05_DadoCitaConMenosDe24Horas_CuandoPacienteIntentaCancelar_EntoncesSeRechazaPorPoliticaClinica()
    {
        // GIVEN (Dado una cita agendada para dentro de solo 8 horas)
        int citaId = 303;
        var cita = new Cita
        {
            Id = citaId,
            Inicio = DateTime.Now.AddHours(8),
            Fin = DateTime.Now.AddHours(9),
            Estado = EstadoCita.Pendiente
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(citaId, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // WHEN & THEN (Cuando el paciente intenta cancelar a última hora, el sistema bloquea la acción)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _citaService.CancelarAsync(citaId));
        Assert.Contains("24 horas de anticipación", ex.Message);
        Assert.Equal(EstadoCita.Pendiente, cita.Estado); // El estado no cambia
    }

    [Fact]
    public async Task HU06_DadoCitasDeDistintosPacientes_CuandoPacienteConsulta_EntoncesSoloRetornaSusPropiasCitas()
    {
        // GIVEN (Dado que María tiene 2 citas y Carlos tiene 1)
        int pacienteId = 15;
        var medico = new Medico { Id = 1, Usuario = new Usuario { NombreCompleto = "Dr. Carlos" } };
        var paciente = new Paciente { Id = pacienteId, Usuario = new Usuario { NombreCompleto = "María" }, NumeroDocumento = "1720000000" };

        var listaCitas = new List<Cita>
        {
            new Cita { Id = 1, PacienteId = pacienteId, Medico = medico, Paciente = paciente, Inicio = DateTime.Now.AddDays(2), Fin = DateTime.Now.AddDays(2).AddHours(1), Motivo = "Cita 1" },
            new Cita { Id = 2, PacienteId = pacienteId, Medico = medico, Paciente = paciente, Inicio = DateTime.Now.AddDays(5), Fin = DateTime.Now.AddDays(5).AddHours(1), Motivo = "Cita 2" }
        };

        _citaRepoMock.Setup(r => r.GetByPacienteAsync(pacienteId, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(listaCitas);

        // WHEN (María consulta sus citas)
        var citas = await _citaService.ObtenerPorPacienteAsync(pacienteId);

        // THEN (Solo se obtienen sus 2 citas y ninguna de otro paciente)
        Assert.Equal(2, citas.Count);
        Assert.All(citas, c => Assert.Equal(pacienteId, c.PacienteId));
    }

    [Fact]
    public async Task HU07_DadoRegistroOperativoClinico_CuandoAdminConsultaMetricas_EntoncesReporteConsolidadoEsExacto()
    {
        // GIVEN (Dado un consolidado operacional en la base de datos)
        var counts = new DashboardCounts(
            TotalCitas: 10,
            CitasPendientes: 3,
            CitasConfirmadas: 4,
            CitasCompletadas: 2,
            TotalMedicos: 5,
            TotalPacientes: 25
        );

        _dashboardRepoMock.Setup(r => r.GetCountsAsync(It.IsAny<CancellationToken>()))
                          .ReturnsAsync(counts);

        // WHEN (El administrador consulta las estadísticas del tablero)
        var stats = await _dashboardService.ObtenerEstadisticasAsync();

        // THEN (Todas las métricas coinciden exactamente con la realidad clínica)
        Assert.Equal(10, stats.TotalCitas);
        Assert.Equal(3, stats.CitasPendientes);
        Assert.Equal(4, stats.CitasConfirmadas);
        Assert.Equal(2, stats.CitasCompletadas);
        Assert.Equal(5, stats.TotalMedicos);
        Assert.Equal(25, stats.TotalPacientes);
    }
}
