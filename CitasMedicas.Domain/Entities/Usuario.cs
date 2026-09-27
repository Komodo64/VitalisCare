namespace CitasMedicas.Domain.Entities;

using CitasMedicas.Domain.Enums;

public class Usuario
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    public Medico? Medico { get; set; }
    public Paciente? Paciente { get; set; }
}