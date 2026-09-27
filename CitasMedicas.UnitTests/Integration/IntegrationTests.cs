namespace CitasMedicas.UnitTests.Integration;

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CitasMedicas.Application.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class IntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public IntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Integration_01_AuthRegister_And_Login_FlujoCompleto()
    {
        // 1. Registro de nuevo paciente en base relacional
        var testEmail = $"integration.test.{Guid.NewGuid():N}@vitalis.local";
        var registerDto = new UserRegisterDto(
            "Paciente Integracion",
            testEmail,
            "Password123!",
            new DateOnly(1990, 5, 20),
            "0987654321",
            "1712345678",
            "https://res.cloudinary.com/demo/image/upload/v1/samples/id-card.jpg"
        );

        var regResponse = await _client.PostAsJsonAsync("/api/auth/register", registerDto);
        Assert.True(regResponse.StatusCode is HttpStatusCode.Created or HttpStatusCode.OK);

        // 2. Login con credenciales válidas
        var loginDto = new UserLoginDto(testEmail, "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var loginJson = await loginResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(loginJson);
        Assert.Equal("Paciente", doc.RootElement.GetProperty("rol").GetString());
        Assert.Equal(testEmail, doc.RootElement.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Integration_02_SyncUser_Y_SyncLogin_PersistenciaCentralizada()
    {
        var testEmail = $"sync.test.{Guid.NewGuid():N}@vitalis.local";
        var syncUserPayload = new
        {
            nombreCompleto = "Usuario Sync Central",
            email = testEmail,
            password = "Password123!",
            telefono = "0998877665",
            numeroDocumento = "0923456789",
            documentoUrl = "https://res.cloudinary.com/vitalis/image/upload/doc.jpg",
            rol = "Paciente"
        };

        var postRes = await _client.PostAsJsonAsync("/api/sync/user", syncUserPayload);
        Assert.True(postRes.StatusCode is HttpStatusCode.Created or HttpStatusCode.OK);

        var loginPayload = new { email = testEmail, password = "Password123!" };
        var loginRes = await _client.PostAsJsonAsync("/api/sync/login", loginPayload);
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
    }

    [Fact]
    public async Task Integration_03_CicloDeVidaCita_Crear_Confirmar_Completar()
    {
        // Generar horario dinámico no conflictivo para pruebas idempotentes
        var randomOffset = Random.Shared.Next(100, 9000);
        var randomHour = Random.Shared.Next(8, 16);
        var baseDate = DateTime.UtcNow.AddDays(randomOffset).Date.AddHours(randomHour);

        var inicio = baseDate.ToString("yyyy-MM-ddTHH:mm:ss");
        var fin = baseDate.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss");

        var nuevaCita = new
        {
            medicoId = "1",
            medicoNombre = "Dra. Valentina Ríos",
            pacienteId = "2",
            pacienteNombre = "Carlos Mendoza",
            inicio = inicio,
            fin = fin,
            motivo = "Evaluación cardiológica integral",
            estado = "Pendiente"
        };

        // Crear cita en almacén central
        var createRes = await _client.PostAsJsonAsync("/api/sync/appointment", nuevaCita);
        Assert.True(createRes.IsSuccessStatusCode);
        var createdJson = await createRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(createdJson);
        var citaId = doc.RootElement.GetProperty("appointment").GetProperty("id").GetString();
        Assert.False(string.IsNullOrWhiteSpace(citaId));

        // Confirmar estado
        var statusRes = await _client.PostAsJsonAsync($"/api/sync/appointment/{citaId}/status", new { nuevoEstado = "Confirmada" });
        Assert.True(statusRes.IsSuccessStatusCode);

        // Completar estado
        var completeRes = await _client.PostAsJsonAsync($"/api/sync/appointment/{citaId}/status", new { nuevoEstado = "Completada" });
        Assert.True(completeRes.IsSuccessStatusCode);
    }

    [Fact]
    public async Task Integration_04_CancelacionCita_ActualizaEstadoACancelada()
    {
        var randomOffset = Random.Shared.Next(100, 9000);
        var randomHour = Random.Shared.Next(8, 16);
        var baseDate = DateTime.UtcNow.AddDays(randomOffset).Date.AddHours(randomHour);

        var inicio = baseDate.ToString("yyyy-MM-ddTHH:mm:ss");
        var fin = baseDate.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss");

        var nuevaCita = new
        {
            medicoId = "2",
            medicoNombre = "Dr. Alejandro Morales",
            pacienteId = "2",
            pacienteNombre = "Carlos Mendoza",
            inicio = inicio,
            fin = fin,
            motivo = "Consulta general reprogramable",
            estado = "Pendiente"
        };

        var createRes = await _client.PostAsJsonAsync("/api/sync/appointment", nuevaCita);
        Assert.True(createRes.IsSuccessStatusCode);
        var createdJson = await createRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(createdJson);
        var citaId = doc.RootElement.GetProperty("appointment").GetProperty("id").GetString();
        Assert.False(string.IsNullOrWhiteSpace(citaId));

        var cancelRes = await _client.PostAsJsonAsync($"/api/sync/appointment/{citaId}/cancel", new { });
        Assert.True(cancelRes.IsSuccessStatusCode);
    }

    [Fact]
    public async Task Integration_05_SyncState_ReflejaContadoresYListasConsistentes()
    {
        var response = await _client.GetAsync("/api/sync/state");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.GetProperty("users").GetArrayLength() > 0);
        Assert.True(root.GetProperty("appointments").GetArrayLength() > 0);

        var stats = root.GetProperty("stats");
        Assert.True(stats.GetProperty("totalCitas").GetInt32() >= 0);
        Assert.True(stats.GetProperty("citasPendientes").GetInt32() >= 0);
        Assert.True(stats.GetProperty("citasConfirmadas").GetInt32() >= 0);
        Assert.True(stats.GetProperty("citasCanceladas").GetInt32() >= 0);
        Assert.True(stats.GetProperty("citasCompletadas").GetInt32() >= 0);
    }
}
