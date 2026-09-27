namespace CitasMedicas.Application.Services;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Interfaces;
using CitasMedicas.Domain.Interfaces;

public class DashboardService(IDashboardRepository dashboardRepository) : IDashboardService
{
    public async Task<DashboardStatsDto> ObtenerEstadisticasAsync(CancellationToken cancellationToken = default)
    {
        var counts = await dashboardRepository.GetCountsAsync(cancellationToken);
        return new(counts.TotalCitas, counts.CitasPendientes, counts.CitasConfirmadas, counts.CitasCompletadas, counts.TotalMedicos, counts.TotalPacientes);
    }
}