namespace CitasMedicas.Domain.Entities;

public class Notificacion
{
    public int Id { get; set; }
    public int CitaId { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public bool Leida { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public Cita Cita { get; set; } = null!;
}