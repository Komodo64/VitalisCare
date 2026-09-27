namespace CitasMedicas.Domain.Entities;

public class Paciente
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public DateOnly FechaNacimiento { get; set; }
    public string Telefono { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string DocumentoUrl { get; set; } = string.Empty;
    public Usuario Usuario { get; set; } = null!;
    public ICollection<Cita> Citas { get; set; } = new List<Cita>();
}