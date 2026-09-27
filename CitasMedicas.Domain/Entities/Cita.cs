namespace CitasMedicas.Domain.Entities;

using CitasMedicas.Domain.Enums;

public class Cita
{
    public int Id { get; set; }
    public int MedicoId { get; set; }
    public int PacienteId { get; set; }
    public DateTime Inicio { get; set; }
    public DateTime Fin { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public EstadoCita Estado { get; set; } = EstadoCita.Pendiente;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public Medico Medico { get; set; } = null!;
    public Paciente Paciente { get; set; } = null!;
    public ICollection<Notificacion> Notificaciones { get; set; } = new List<Notificacion>();
}