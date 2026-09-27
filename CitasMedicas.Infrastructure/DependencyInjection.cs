namespace CitasMedicas.Infrastructure;

using CitasMedicas.Domain.Interfaces;
using CitasMedicas.Infrastructure.Data;
using CitasMedicas.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(configuration.GetConnectionString("DefaultConnection") ?? "Data Source=citasmedicas.db"));
        services.AddScoped<ICitaRepository, CitaRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        return services;
    }
}