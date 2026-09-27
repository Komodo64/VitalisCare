namespace CitasMedicas.Application.Services;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Interfaces;
using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;

public class UsuarioService(IUsuarioRepository usuarioRepository) : IUsuarioService
{
    public async Task<Usuario?> AutenticarAsync(UserLoginDto dto, CancellationToken cancellationToken = default)
    {
        var usuario = await usuarioRepository.GetByEmailAsync(dto.Email, cancellationToken);
        return usuario is not null && BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash) ? usuario : null;
    }

    public Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
        => usuarioRepository.GetByIdAsync(id, cancellationToken);

    public async Task<Usuario> RegistrarPacienteAsync(UserRegisterDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreCompleto) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            throw new ArgumentException("El nombre, correo y contraseña son obligatorios.");

        var existente = await usuarioRepository.GetByEmailAsync(dto.Email, cancellationToken);
        if (existente is not null)
            throw new InvalidOperationException("Ya existe una cuenta con este correo electrónico.");

        var usuario = new Usuario
        {
            NombreCompleto = dto.NombreCompleto.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Rol = RolUsuario.Paciente,
            Paciente = new Paciente
            {
                FechaNacimiento = dto.FechaNacimiento,
                Telefono = dto.Telefono?.Trim() ?? string.Empty,
                NumeroDocumento = dto.NumeroDocumento?.Trim() ?? string.Empty,
                DocumentoUrl = dto.DocumentoUrl?.Trim() ?? string.Empty
            }
        };

        await usuarioRepository.AddAsync(usuario, cancellationToken);
        await usuarioRepository.SaveChangesAsync(cancellationToken);
        return usuario;
    }

    public Task<IReadOnlyList<Medico>> ObtenerMedicosAsync(CancellationToken cancellationToken = default)
        => usuarioRepository.GetMedicosAsync(cancellationToken);
}