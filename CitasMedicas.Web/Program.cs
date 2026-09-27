using System.Security.Claims;
using CitasMedicas.Application.Interfaces;
using CitasMedicas.Application.Services;
using CitasMedicas.Infrastructure;
using CitasMedicas.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
{
	options.Cookie.Name = "CitasMedicas.Auth";
	options.Cookie.HttpOnly = true;
	options.Cookie.SameSite = SameSiteMode.Strict;
	options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
		? CookieSecurePolicy.SameAsRequest
		: CookieSecurePolicy.Always;
	options.ExpireTimeSpan = TimeSpan.FromHours(8);
	options.SlidingExpiration = true;
	options.LoginPath = "/api/auth/login";
	options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
});
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
	options.AddDefaultPolicy(policy =>
		policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<ICitaService, CitaService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
	app.UseHttpsRedirection();
}
using (var scope = app.Services.CreateScope())
	await DbSeeder.SeedAsync(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>());
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/status", () => Results.Ok(new
{
	nombre = "Vitalis Care - Plataforma de Gestion de Citas Medicas",
	estado = "ok",
	endpoints = new[] { "/api/medicos", "/api/auth/login", "/api/auth/me", "/api/auth/register", "/api/citas", "/api/dashboard/stats", "/api/diagnostics/resources" }
}));

app.MapGet("/api/diagnostics/resources", () =>
{
	var proc = System.Diagnostics.Process.GetCurrentProcess();
	var gcMemBytes = GC.GetTotalMemory(false);
	var workingSetBytes = proc.WorkingSet64;
	var uptime = DateTime.UtcNow - proc.StartTime.ToUniversalTime();

	var dbPath = Path.Combine(app.Environment.ContentRootPath, "citasmedicas.db");
	long dbSizeBytes = File.Exists(dbPath) ? new FileInfo(dbPath).Length : 0;

	return Results.Ok(new
	{
		processId = proc.Id,
		processName = proc.ProcessName,
		framework = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
		os = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
		architecture = System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture.ToString(),
		uptime = $"{(int)uptime.TotalHours:D2}:{uptime.Minutes:D2}:{uptime.Seconds:D2}",
		uptimeSeconds = (long)uptime.TotalSeconds,
		ramWorkingSetMB = Math.Round(workingSetBytes / (1024.0 * 1024.0), 2),
		ramPrivateMB = Math.Round(proc.PrivateMemorySize64 / (1024.0 * 1024.0), 2),
		gcHeapMB = Math.Round(gcMemBytes / (1024.0 * 1024.0), 2),
		threadsCount = proc.Threads.Count,
		cpuTimeSeconds = Math.Round(proc.TotalProcessorTime.TotalSeconds, 2),
		dbFileSizeBytes = dbSizeBytes,
		dbFileSizeKB = Math.Round(dbSizeBytes / 1024.0, 2),
		status = "Healthy",
		timestamp = DateTime.UtcNow
	});
});

app.MapControllers();

app.Run();

public partial class Program { }
