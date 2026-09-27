namespace CitasMedicas.UnitTests.Services;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Services;
using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;
using Moq;
using Xunit;

public class CitaServiceTests
{
    private readonly Mock<ICitaRepository> _citaRepoMock = new();
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
    private readonly CitaService _service;

    public CitaServiceTests()
    {
        _service = new CitaService(_citaRepoMock.Object, _usuarioRepoMock.Object);
    }

    [Fact]
    public async Task CrearAsync_DebeLanzarExcepcion_SiInicioEsMayorOIgualAFin()
    {
        // Arrange
        var ahora = DateTime.Now.AddDays(2);
        var dto = new CitaCreateDto(1, 1, ahora.AddHours(2), ahora, "Consulta general");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CrearAsync(dto));
        Assert.Contains("anterior a la hora de fin", ex.Message);
    }

    [Fact]
    public async Task CrearAsync_DebeLanzarExcepcion_SiCitaEstaEnElPasado()
    {
        // Arrange
        var pasado = DateTime.Now.AddDays(-1);
        var dto = new CitaCreateDto(1, 1, pasado, pasado.AddHours(1), "Consulta general");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CrearAsync(dto));
        Assert.Contains("en el futuro", ex.Message);
    }

    [Fact]
    public async Task CrearAsync_DebeLanzarExcepcion_SiHaySolapamientoDeHorario()
    {
        // Arrange
        var inicio = DateTime.Now.AddDays(2);
        var fin = inicio.AddHours(1);
        var dto = new CitaCreateDto(1, 1, inicio, fin, "Consulta cardiaca");

        _citaRepoMock
            .Setup(r => r.HasOverlapAsync(dto.MedicoId, inicio, fin, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CrearAsync(dto));
        Assert.Contains("ya tiene una cita en ese horario", ex.Message);
    }

    [Fact]
    public async Task CrearAsync_DebeLanzarExcepcion_SiNoHayDisponibilidad()
    {
        // Arrange
        var inicio = DateTime.Now.AddDays(2);
        var fin = inicio.AddHours(1);
        var dto = new CitaCreateDto(1, 1, inicio, fin, "Consulta");

        _citaRepoMock
            .Setup(r => r.HasOverlapAsync(dto.MedicoId, inicio, fin, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _citaRepoMock
            .Setup(r => r.ReserveAvailabilityAsync(dto.MedicoId, inicio, fin, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CrearAsync(dto));
        Assert.Contains("no está disponible", ex.Message);
    }

    [Fact]
    public async Task CrearAsync_DebeLanzarExcepcion_SiMedicoNoExiste()
    {
        // Arrange
        var inicio = DateTime.Now.AddDays(2);
        var fin = inicio.AddHours(1);
        var dto = new CitaCreateDto(99, 1, inicio, fin, "Consulta");

        _citaRepoMock
            .Setup(r => r.HasOverlapAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _citaRepoMock
            .Setup(r => r.ReserveAvailabilityAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _usuarioRepoMock
            .Setup(u => u.GetMedicoByUsuarioIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Medico?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.CrearAsync(dto));
        Assert.Contains("Médico no encontrado", ex.Message);
    }

    [Fact]
    public async Task CrearAsync_DebeCrearCita_CuandoDatosSonValidos()
    {
        // Arrange
        var inicio = DateTime.Now.AddDays(3);
        var fin = inicio.AddHours(1);
        var dto = new CitaCreateDto(1, 2, inicio, fin, "Revisión anual");

        var doctorUser = new Usuario { Id = 1, NombreCompleto = "Dra. Ana García", Email = "ana@citas.local", Rol = RolUsuario.Medico };
        var medico = new Medico { Id = 10, UsuarioId = 1, Especialidad = "Cardiología", NumeroLicencia = "MED-1001", Usuario = doctorUser };

        var patientUser = new Usuario { Id = 2, NombreCompleto = "Carlos Ruiz", Email = "carlos@citas.local", Rol = RolUsuario.Paciente };
        var paciente = new Paciente { Id = 20, UsuarioId = 2, Usuario = patientUser };

        _citaRepoMock
            .Setup(r => r.HasOverlapAsync(dto.MedicoId, inicio, fin, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _citaRepoMock
            .Setup(r => r.ReserveAvailabilityAsync(dto.MedicoId, inicio, fin, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _usuarioRepoMock
            .Setup(u => u.GetMedicoByUsuarioIdAsync(dto.MedicoId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(medico);
        _usuarioRepoMock
            .Setup(u => u.GetPacienteByUsuarioIdAsync(dto.PacienteId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(paciente);

        // Act
        var result = await _service.CrearAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Dra. Ana García", result.Medico);
        Assert.Equal("Carlos Ruiz", result.Paciente);
        Assert.Equal("Revisión anual", result.Motivo);
        Assert.Equal(EstadoCita.Pendiente, result.Estado);

        _citaRepoMock.Verify(r => r.AddAsync(It.IsAny<Cita>(), It.IsAny<CancellationToken>()), Times.Once);
        _citaRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CancelarAsync_DebeLanzarExcepcion_SiCancelacionEsConMenosDe24Horas()
    {
        // Arrange (cita programada en 10 horas)
        var cita = new Cita
        {
            Id = 5,
            Inicio = DateTime.Now.AddHours(10),
            Fin = DateTime.Now.AddHours(11),
            Estado = EstadoCita.Pendiente
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CancelarAsync(5));
        Assert.Contains("24 horas de anticipación", ex.Message);
    }

    [Fact]
    public async Task CancelarAsync_DebeLanzarExcepcion_SiCitaYaFueCancelada()
    {
        // Arrange
        var cita = new Cita
        {
            Id = 6,
            Inicio = DateTime.Now.AddDays(5),
            Fin = DateTime.Now.AddDays(5).AddHours(1),
            Estado = EstadoCita.Cancelada
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(6, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CancelarAsync(6));
        Assert.Contains("no puede cancelarse en su estado actual", ex.Message);
    }

    [Fact]
    public async Task CancelarAsync_DebeCancelarExitosamente_SiCumpleAnticipacion()
    {
        // Arrange (cita en 3 días)
        var cita = new Cita
        {
            Id = 7,
            Inicio = DateTime.Now.AddDays(3),
            Fin = DateTime.Now.AddDays(3).AddHours(1),
            Estado = EstadoCita.Pendiente
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // Act
        await _service.CancelarAsync(7);

        // Assert
        Assert.Equal(EstadoCita.Cancelada, cita.Estado);
        _citaRepoMock.Verify(r => r.Update(cita), Times.Once);
        _citaRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CambiarEstadoAsync_DebeActualizarEstado_CuandoCitaEsValida()
    {
        // Arrange
        var cita = new Cita
        {
            Id = 8,
            Inicio = DateTime.Now.AddDays(2),
            Fin = DateTime.Now.AddDays(2).AddHours(1),
            Estado = EstadoCita.Pendiente
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(8, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // Act
        await _service.CambiarEstadoAsync(8, EstadoCita.Confirmada);

        // Assert
        Assert.Equal(EstadoCita.Confirmada, cita.Estado);
        _citaRepoMock.Verify(r => r.Update(cita), Times.Once);
        _citaRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CambiarEstadoAsync_DebeLanzarExcepcion_SiCitaEstaCancelada()
    {
        // Arrange
        var cita = new Cita
        {
            Id = 9,
            Inicio = DateTime.Now.AddDays(2),
            Fin = DateTime.Now.AddDays(2).AddHours(1),
            Estado = EstadoCita.Cancelada
        };

        _citaRepoMock.Setup(r => r.GetByIdAsync(9, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CambiarEstadoAsync(9, EstadoCita.Confirmada));
        Assert.Contains("No se puede modificar una cita cancelada", ex.Message);
    }
}
