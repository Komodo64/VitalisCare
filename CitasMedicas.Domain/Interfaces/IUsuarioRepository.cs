namespace CitasMedicas.Domain.Interfaces;

using CitasMedicas.Domain.Entities;

public interface IUsuarioRepository : IRepository<Usuario>
{
    Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<Medico?> GetMedicoByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<Paciente?> GetPacienteByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Medico>> GetMedicosAsync(CancellationToken cancellationToken = default);
}