namespace CitasMedicas.UnitTests.Smoke;

using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

public class SmokeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public SmokeTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task HealthCheck_Retorna200_Y_EstadoHealthy()
    {
        // Act (Verificación rápida de disponibilidad del core de la API /healthz)
        var response = await _client.GetAsync("/healthz");
        
        // Assert
        response.EnsureSuccessStatusCode(); // HTTP 200 OK
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", content);
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_01_ApiStatus_DebeResponderOk_Y_ListarEndpoints()
    {
        // Act
        var response = await _client.GetAsync("/api/status");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        
        Assert.Equal("ok", root.GetProperty("estado").GetString());
        Assert.True(root.TryGetProperty("endpoints", out var endpoints));
        Assert.True(endpoints.GetArrayLength() > 0);
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_02_TelemetriaRecursos_DebeEstarSaludable_Y_ReportarMemoria()
    {
        // Act
        var response = await _client.GetAsync("/api/diagnostics/resources");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.Equal("Healthy", root.GetProperty("status").GetString());
        Assert.True(root.GetProperty("ramWorkingSetMB").GetDouble() > 0);
        Assert.True(root.GetProperty("threadsCount").GetInt32() > 0);
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_03_CatalogoMedicos_DebeEstarDisponible_ConDoctoresSemilla()
    {
        // Act
        var response = await _client.GetAsync("/api/medicos");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        
        Assert.True(doc.RootElement.GetArrayLength() >= 2);
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_04_SyncState_DebeRetornarEstructuraCentralizada()
    {
        // Act
        var response = await _client.GetAsync("/api/sync/state");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("users", out var users));
        Assert.True(root.TryGetProperty("appointments", out var appts));
        Assert.True(root.TryGetProperty("stats", out var stats));
        Assert.True(users.GetArrayLength() >= 3);
    }
}
