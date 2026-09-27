namespace CitasMedicas.Application.DTOs;

public record DashboardStatsDto(int TotalCitas, int CitasPendientes, int CitasConfirmadas, int CitasCompletadas, int TotalMedicos, int TotalPacientes);