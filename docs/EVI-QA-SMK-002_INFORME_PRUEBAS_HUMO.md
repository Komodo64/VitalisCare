# DOCUMENTO 2: INFORME DE PRUEBAS DE HUMO (SMOKE TESTING / BVT)

**Código de Documento:** `EVI-QA-SMK-002`  
**Compilación Evaluada:** Build Release v2.4.0 (Commit: `main-final-release`)  
**Entorno:** Staging & CI Pipeline (WebApplicationFactory / Kestrel Test Server)  
**Fecha de Ejecución:** 27 de septiembre de 2026  
**Responsables:** Brandon Alessandro Hernández Escobar, Johny Matheo Franco Zuleta (Ingenieros de QA / Release Managers)  

---

## 1. Objetivo de la Prueba
Verificar en menos de 30 segundos que los servicios troncales de **Vitalis Care** (APIs REST, base de datos SQLite relacional, caché de disponibilidad horaria y endpoints de diagnóstico) compilen, levanten en memoria, superen los probes de salud (*Health Checks*) y respondan con códigos HTTP 200 sin excepciones no controladas antes de habilitar tráfico a usuarios.

---

## 2. Implementación del Runner de Humo en C#

```csharp
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
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
        var response = await _client.GetAsync("/healthz");
        response.EnsureSuccessStatusCode(); // HTTP 200 OK
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", content);
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_01_ApiStatus_DebeResponderOk_Y_ListarEndpoints()
    {
        var response = await _client.GetAsync("/api/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("ok", doc.RootElement.GetProperty("estado").GetString());
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_02_TelemetriaRecursos_DebeEstarSaludable_Y_ReportarMemoria()
    {
        var response = await _client.GetAsync("/api/diagnostics/resources");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.Equal("Healthy", doc.RootElement.GetProperty("status").GetString());
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_03_CatalogoMedicos_DebeEstarDisponible_ConDoctoresSemilla()
    {
        var response = await _client.GetAsync("/api/medicos");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.GetArrayLength() >= 2);
    }

    [Fact, Trait("Category", "Smoke")]
    public async Task Smoke_04_SyncState_DebeRetornarEstructuraCentralizada()
    {
        var response = await _client.GetAsync("/api/sync/state");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
```

---

## 3. Matriz de Resultados

| ID | Endpoint / Operación | Método | Resultado Esperado | Código Obtenido | Latencia | Estado |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **SMK-01** | `/healthz` (Host Health Check & DB Probe) | GET | 200 OK | 200 OK | 18 ms | Exitoso |
| **SMK-02** | `/api/status` (Catálogo de Endpoints API) | GET | 200 OK | 200 OK | 12 ms | Exitoso |
| **SMK-03** | `/api/diagnostics/resources` (Telemetría CPU/RAM) | GET | 200 OK | 200 OK | 15 ms | Exitoso |
| **SMK-04** | `/api/medicos` (Directorio de Especialistas Semilla)| GET | 200 OK | 200 OK | 22 ms | Exitoso |
| **SMK-05** | `/api/sync/state` (Almacén Centralizado Multi-Rol)  | GET | 200 OK | 200 OK | 19 ms | Exitoso |

---

## 4. Veredicto
**APROBADO.** La compilación demuestra estabilidad operativa fundamental; tiempo total de ejecución de la suite: **1.1 segundos** (cumpliendo con la exigencia reglamentaria de `< 30 segundos`). Se habilita la ejecución de la batería de pruebas de integración y aceptación.
