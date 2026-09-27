namespace CitasMedicas.Application.Interfaces;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Domain.Enums;

public interface ICitaService
{
    Task<CitaReadDto> CrearAsync(CitaCreateDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CitaReadDto>> ObtenerPorPacienteAsync(int pacienteId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CitaReadDto>> ObtenerPorMedicoAsync(int medicoId, CancellationToken cancellationToken = default);
    Task<CitaReadDto?> ObtenerAsync(int id, CancellationToken cancellationToken = default);
    Task CancelarAsync(int id, CancellationToken cancellationToken = default);
    Task CambiarEstadoAsync(int id, EstadoCita nuevoEstado, CancellationToken cancellationToken = default);
}