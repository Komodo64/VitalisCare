namespace CitasMedicas.Domain.Interfaces;

using CitasMedicas.Domain.Entities;

public interface ICitaRepository : IRepository<Cita>
{
    Task<IReadOnlyList<Cita>> GetByPacienteAsync(int pacienteId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Cita>> GetByMedicoAsync(int medicoId, DateTime? desde = null, CancellationToken cancellationToken = default);
    Task<bool> HasOverlapAsync(int medicoId, DateTime inicio, DateTime fin, int? excludedId = null, CancellationToken cancellationToken = default);
    Task<bool> ReserveAvailabilityAsync(int medicoId, DateTime inicio, DateTime fin, CancellationToken cancellationToken = default);
}