namespace CitasMedicas.Application.DTOs;

using CitasMedicas.Domain.Enums;

public record CitaCambiarEstadoDto(
    EstadoCita NuevoEstado
);
