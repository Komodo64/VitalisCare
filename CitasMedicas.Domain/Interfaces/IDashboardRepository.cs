namespace CitasMedicas.Domain.Interfaces;

public record DashboardCounts(int TotalCitas, int CitasPendientes, int CitasConfirmadas, int CitasCompletadas, int TotalMedicos, int TotalPacientes);

public interface IDashboardRepository
{
    Task<DashboardCounts> GetCountsAsync(CancellationToken cancellationToken = default);
}