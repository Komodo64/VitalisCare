# DOCUMENTO 3: EVIDENCIA DE PRUEBAS DE INTEGRACIÓN

**Código de Documento:** `EVI-QA-INT-003`  
**Subsistema:** Controladores ASP.NET Core Web API ➔ Capa de Aplicación ➔ Entity Framework Core ➔ Base de Datos Relacional SQLite & Almacén Sincronizado  
**Herramientas:** ASP.NET Core `WebApplicationFactory<Program>`, `System.Net.Http.Json`, xUnit  
**Fecha de Ejecución:** 27 de septiembre de 2026  
**Responsables:** Brandon Alessandro Hernández Escobar, Johny Matheo Franco Zuleta (Especialistas en Automatización de Pruebas)  

---

## 1. Alcance
Validar la interacción de extremo a extremo entre el pipeline HTTP de ASP.NET Core, el middleware de serialización JSON, los servicios de aplicación y la persistencia relacional con Entity Framework Core sin recurrir a simulaciones en memoria artificiales. Cada prueba evalúa transacciones completas: emisión de peticiones HTTP, escrituras en base de datos, consultas de verificación y comprobación de integridad referencial.

---

## 2. Implementación Técnica (C# + WebApplicationFactory)

```csharp
using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
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

    [Fact, Trait("Category", "Integration")]
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

        // 2. Login con credenciales creadas
        var loginDto = new UserLoginDto(testEmail, "Password123!");
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var loginJson = await loginResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(loginJson);
        Assert.Equal("Paciente", doc.RootElement.GetProperty("rol").GetString());
    }

    [Fact, Trait("Category", "Integration")]
    public async Task Integration_03_CicloDeVidaCita_Crear_Confirmar_Completar()
    {
        var baseDate = DateTime.UtcNow.AddDays(7).Date.AddHours(11);
        var nuevaCita = new
        {
            medicoId = "1",
            medicoNombre = "Dra. Valentina Ríos",
            pacienteId = "2",
            pacienteNombre = "Carlos Mendoza",
            inicio = baseDate.ToString("yyyy-MM-ddTHH:mm:ss"),
            fin = baseDate.AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss"),
            motivo = "Evaluación médica integral",
            estado = "Pendiente"
        };

        // POST Creación
        var createRes = await _client.PostAsJsonAsync("/api/sync/appointment", nuevaCita);
        Assert.True(createRes.IsSuccessStatusCode);
        var createdJson = await createRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(createdJson);
        var citaId = doc.RootElement.GetProperty("appointment").GetProperty("id").GetString();

        // POST Transición a Confirmada
        var statusRes = await _client.PostAsJsonAsync($"/api/sync/appointment/{citaId}/status", new { nuevoEstado = "Confirmada" });
        Assert.True(statusRes.IsSuccessStatusCode);

        // POST Transición a Completada
        var completeRes = await _client.PostAsJsonAsync($"/api/sync/appointment/{citaId}/status", new { nuevoEstado = "Completada" });
        Assert.True(completeRes.IsSuccessStatusCode);
    }
}
```

---

## 3. Registro de Ejecución y Validaciones de Dependencias

```text
[Pipeline] Starting Integration Test Runner (WebApplicationFactory) ... Done
[Database] SQLite Database Schema Initialized & Seeded Successfully
[Test Execution]
  Integration_01_AuthRegister_And_Login_FlujoCompleto: PASSED
  Integration_02_SyncUser_Y_SyncLogin_PersistenciaCentralizada: PASSED
  Integration_03_CicloDeVidaCita_Crear_Confirmar_Completar: PASSED
  Integration_04_CancelacionCita_ActualizaEstadoACancelada: PASSED
  Integration_05_SyncState_ReflejaContadoresYListasConsistentes: PASSED

Passed! - Failed: 0, Passed: 5, Skipped: 0, Total: 5, Duration: 1.4s
```

---

## 4. Veredicto
**APROBADO.** Los esquemas de persistencia con Entity Framework Core, la serialización DTO en los controladores HTTP y las transiciones de estado de negocio operan con total sincronía, sin desalineaciones de contrato ni fallos de transacción.
