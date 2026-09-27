namespace CitasMedicas.Application.Interfaces;

using CitasMedicas.Application.DTOs;

public interface IDashboardService
{
    Task<DashboardStatsDto> ObtenerEstadisticasAsync(CancellationToken cancellationToken = default);
}