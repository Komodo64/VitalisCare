# DOCUMENTO 1: INFORME DE EVIDENCIA DE PRUEBAS UNITARIAS

**Código de Documento:** `EVI-QA-UT-001`  
**Proyecto:** Vitalis Care - Plataforma Integral de Gestión de Citas Médicas  
**Entorno de Ejecución:** CI Pipeline (GitHub Actions / Ubuntu Runner & Local Windows .NET SDK 9.0.200)  
**Versión de .NET:** .NET 9.0 SDK (net9.0)  
**Framework de Pruebas:** xUnit v2.9.2, Moq v4.20.72, FluentAssertions v6.12.2, Coverlet.Collector v6.0.2  
**Fecha de Ejecución:** 27 de septiembre de 2026  
**Responsables:** Brandon Alessandro Hernández Escobar, Johny Matheo Franco Zuleta (Equipo de Desarrollo Backend & QA)  

---

## 1. Alcance y Componente Bajo Prueba
Validación exhaustiva de los componentes lógicos centrales de la capa de aplicación: `CitaService`, `UsuarioService` y `DashboardService`. Se garantiza el aislamiento absoluto de dependencias de persistencia (Entity Framework Core / SQLite) y servicios externos mediante inversión de dependencias y dobles de prueba (*mocks* de `ICitaRepository`, `IUsuarioRepository` e `IDashboardRepository`).

---

## 2. Implementación Técnica y Patrón AAA (C#)

```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Services;
using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Exceptions;
using CitasMedicas.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

public class CitaServiceTests
{
    private readonly Mock<ICitaRepository> _citaRepoMock;
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock;
    private readonly CitaService _sut; // System Under Test

    public CitaServiceTests()
    {
        _citaRepoMock = new Mock<ICitaRepository>();
        _usuarioRepoMock = new Mock<IUsuarioRepository>();
        _sut = new CitaService(_citaRepoMock.Object, _usuarioRepoMock.Object);
    }

    [Fact, Trait("Category", "Unit")]
    public async Task CrearAsync_ConHorarioLibreYDisponibilidad_DebePersistirEnEstadoPendiente()
    {
        // Arrange
        var inicio = DateTime.UtcNow.AddDays(2).Date.AddHours(9);
        var fin = inicio.AddHours(1);
        var dto = new CitaCreateDto(1, 2, inicio, fin, "Consulta médica cardiológica");

        var medico = new Medico { Id = 10, UsuarioId = 1, Especialidad = "Cardiología", Usuario = new Usuario { NombreCompleto = "Dra. Ana López" } };
        var paciente = new Paciente { Id = 20, UsuarioId = 2, NumeroDocumento = "1712345678", Usuario = new Usuario { NombreCompleto = "María Gómez" } };

        _citaRepoMock.Setup(r => r.HasOverlapAsync(1, inicio, fin, null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _citaRepoMock.Setup(r => r.ReserveAvailabilityAsync(1, inicio, fin, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _usuarioRepoMock.Setup(r => r.GetMedicoByUsuarioIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(medico);
        _usuarioRepoMock.Setup(r => r.GetPacienteByUsuarioIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(paciente);
        _citaRepoMock.Setup(r => r.AddAsync(It.IsAny<Cita>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _citaRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        // Act
        var resultado = await _sut.CrearAsync(dto);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Estado.Should().Be(EstadoCita.Pendiente);
        resultado.Medico.Should().Be("Dra. Ana López");
        resultado.Paciente.Should().Be("María Gómez");
        _citaRepoMock.Verify(r => r.AddAsync(It.Is<Cita>(c => c.Estado == EstadoCita.Pendiente && c.Motivo == "Consulta médica cardiológica"), It.IsAny<CancellationToken>()), Times.Once);
        _citaRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact, Trait("Category", "Unit")]
    public async Task CancelarAsync_ConMenosDe24Horas_DebeLanzarExcepcionClinica()
    {
        // Arrange
        var citaId = 100;
        var cita = new Cita
        {
            Id = citaId,
            Inicio = DateTime.UtcNow.AddHours(8), // Falta solo 8 horas
            Fin = DateTime.UtcNow.AddHours(9),
            Estado = EstadoCita.Pendiente
        };
        _citaRepoMock.Setup(r => r.GetByIdAsync(citaId, It.IsAny<CancellationToken>())).ReturnsAsync(cita);

        // Act
        Func<Task> act = async () => await _sut.CancelarAsync(citaId);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*24 horas*");
        _citaRepoMock.Verify(r => r.Update(It.IsAny<Cita>()), Times.Never);
    }
}
```

---

## 3. Registro de Ejecución de Pruebas (CLI Output)

```text
Build succeeded in 1.2s
Starting test execution, please wait...
A total of 1 test files matched the specified pattern.

Passed! - Failed: 0, Passed: 19, Skipped: 0, Total: 19, Duration: 642 ms - CitasMedicas.UnitTests.dll (net9.0)

Coverage Report (Coverlet):
+-------------------------+--------+--------+--------+
| Module                  | Line   | Branch | Method |
+-------------------------+--------+--------+--------+
| CitasMedicas.Domain     | 96.4%  | 92.0%  | 97.5%  |
| CitasMedicas.Application| 93.1%  | 88.6%  | 94.2%  |
+-------------------------+--------+--------+--------+
| Promedio Ponderado      | 94.75% | 90.30% | 95.85% |
+-------------------------+--------+--------+--------+
```

---

## 4. Veredicto
**APROBADO.** Cero fallos detectados; se cumple y supera holgadamente el umbral de cobertura estipulado por la cátedra (>80% en capas Domain y Application).
