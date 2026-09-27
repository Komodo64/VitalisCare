namespace CitasMedicas.UnitTests.Services;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Services;
using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;
using Moq;
using Xunit;

public class UsuarioServiceTests
{
    private readonly Mock<IUsuarioRepository> _usuarioRepoMock = new();
    private readonly UsuarioService _service;

    public UsuarioServiceTests()
    {
        _service = new UsuarioService(_usuarioRepoMock.Object);
    }

    [Fact]
    public async Task AutenticarAsync_DebeRetornarUsuario_ConCredencialesCorrectas()
    {
        // Arrange
        const string password = "SecretPassword123!";
        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        var usuario = new Usuario
        {
            Id = 1,
            NombreCompleto = "Dr. Carlos",
            Email = "carlos@citas.local",
            PasswordHash = hash,
            Rol = RolUsuario.Medico
        };

        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("carlos@citas.local", It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var dto = new UserLoginDto("carlos@citas.local", password);

        // Act
        var result = await _service.AutenticarAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Dr. Carlos", result.NombreCompleto);
        Assert.Equal(RolUsuario.Medico, result.Rol);
    }

    [Fact]
    public async Task AutenticarAsync_DebeRetornarNull_ConPasswordIncorrecto()
    {
        // Arrange
        var hash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword123!");
        var usuario = new Usuario
        {
            Id = 2,
            Email = "usuario@citas.local",
            PasswordHash = hash
        };

        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("usuario@citas.local", It.IsAny<CancellationToken>()))
            .ReturnsAsync(usuario);

        var dto = new UserLoginDto("usuario@citas.local", "WrongPassword!");

        // Act
        var result = await _service.AutenticarAsync(dto);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task AutenticarAsync_DebeRetornarNull_SiUsuarioNoExiste()
    {
        // Arrange
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Usuario?)null);

        var dto = new UserLoginDto("inexistente@citas.local", "123456");

        // Act
        var result = await _service.AutenticarAsync(dto);

        // Assert
        Assert.Null(result);
    }

    [Theory]
    [InlineData("", "test@test.com", "pass123")]
    [InlineData("Nombre", "", "pass123")]
    [InlineData("Nombre", "test@test.com", "")]
    public async Task RegistrarPacienteAsync_DebeLanzarExcepcion_SiCamposEstanVacios(string nombre, string email, string pass)
    {
        // Arrange
        var dto = new UserRegisterDto(nombre, email, pass, new DateOnly(2000, 1, 1), "555-1234");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.RegistrarPacienteAsync(dto));
        Assert.Contains("obligatorios", ex.Message);
    }

    [Fact]
    public async Task RegistrarPacienteAsync_DebeLanzarExcepcion_SiEmailYaExiste()
    {
        // Arrange
        var existente = new Usuario { Id = 10, Email = "duplicado@test.com" };
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("duplicado@test.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existente);

        var dto = new UserRegisterDto("Juan Pérez", "duplicado@test.com", "Pass123!", new DateOnly(1995, 5, 5), "555-9999");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RegistrarPacienteAsync(dto));
        Assert.Contains("Ya existe una cuenta", ex.Message);
    }

    [Fact]
    public async Task RegistrarPacienteAsync_DebeCrearPaciente_ConDatosValidos()
    {
        // Arrange
        _usuarioRepoMock
            .Setup(r => r.GetByEmailAsync("nuevo@test.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Usuario?)null);

        var dto = new UserRegisterDto("Lucía Gómez", "nuevo@test.com", "PasswordSeguro123!", new DateOnly(1992, 10, 15), "555-7788");

        // Act
        var result = await _service.RegistrarPacienteAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Lucía Gómez", result.NombreCompleto);
        Assert.Equal("nuevo@test.com", result.Email);
        Assert.Equal(RolUsuario.Paciente, result.Rol);
        Assert.NotNull(result.Paciente);
        Assert.Equal("555-7788", result.Paciente.Telefono);
        Assert.True(BCrypt.Net.BCrypt.Verify("PasswordSeguro123!", result.PasswordHash));

        _usuarioRepoMock.Verify(r => r.AddAsync(It.IsAny<Usuario>(), It.IsAny<CancellationToken>()), Times.Once);
        _usuarioRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
