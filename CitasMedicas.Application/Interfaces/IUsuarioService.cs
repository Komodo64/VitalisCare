namespace CitasMedicas.Application.Interfaces;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Domain.Entities;

public interface IUsuarioService
{
    Task<Usuario?> AutenticarAsync(UserLoginDto dto, CancellationToken cancellationToken = default);
    Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Usuario> RegistrarPacienteAsync(UserRegisterDto dto, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Medico>> ObtenerMedicosAsync(CancellationToken cancellationToken = default);
}