namespace CitasMedicas.Domain.Entities;

public class Medico
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Especialidad { get; set; } = string.Empty;
    public string NumeroLicencia { get; set; } = string.Empty;
    public Usuario Usuario { get; set; } = null!;
    public ICollection<DisponibilidadMedica> Disponibilidades { get; set; } = new List<DisponibilidadMedica>();
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}