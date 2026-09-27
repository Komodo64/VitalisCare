using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using NBomber.Contracts;
using NBomber.CSharp;

Console.WriteLine("=================================================");
Console.WriteLine("🩺 VITALIS CARE - EJECUCIÓN DE PRUEBAS DE CARGA NBOMBER");
Console.WriteLine("=================================================");

using var factory = new WebApplicationFactory<CitasMedicas.Web.Controllers.AuthController>();
using var client = factory.CreateClient();

// Escenario 1: Endpoint de Salud y Estado General (/api/status)
var scenarioStatus = Scenario.Create("api_status_health", async context =>
{
    var response = await client.GetAsync("/api/status");
    var size = (int)(response.Content.Headers.ContentLength ?? 128);
    var code = ((int)response.StatusCode).ToString();
    return response.IsSuccessStatusCode
        ? Response.Ok(statusCode: code, sizeBytes: size)
        : Response.Fail(statusCode: code);
})
.WithoutWarmUp()
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 15, during: TimeSpan.FromSeconds(6))
);

// Escenario 2: Catálogo de Médicos Especialistas (/api/medicos)
var scenarioMedicos = Scenario.Create("api_medicos_catalog", async context =>
{
    var response = await client.GetAsync("/api/medicos");
    var size = (int)(response.Content.Headers.ContentLength ?? 256);
    var code = ((int)response.StatusCode).ToString();
    return response.IsSuccessStatusCode
        ? Response.Ok(statusCode: code, sizeBytes: size)
        : Response.Fail(statusCode: code);
})
.WithoutWarmUp()
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 15, during: TimeSpan.FromSeconds(6))
);

// Escenario 3: Sincronización de Estado Global (/api/sync/state)
var scenarioSyncState = Scenario.Create("api_sync_state_replication", async context =>
{
    var response = await client.GetAsync("/api/sync/state");
    var size = (int)(response.Content.Headers.ContentLength ?? 512);
    var code = ((int)response.StatusCode).ToString();
    return response.IsSuccessStatusCode
        ? Response.Ok(statusCode: code, sizeBytes: size)
        : Response.Fail(statusCode: code);
})
.WithoutWarmUp()
.WithLoadSimulations(
    Simulation.KeepConstant(copies: 15, during: TimeSpan.FromSeconds(6))
);

Console.WriteLine("🚀 Iniciando simulación de carga concurrente...");
NBomberRunner
    .RegisterScenarios(scenarioStatus, scenarioMedicos, scenarioSyncState)
    .Run();

Console.WriteLine("\n✅ Ejecución de NBomber finalizada con éxito.");
