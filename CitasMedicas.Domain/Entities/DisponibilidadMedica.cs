namespace CitasMedicas.Domain.Entities;

public class DisponibilidadMedica
{
    public int Id { get; set; }
    public int MedicoId { get; set; }
    public DateTime Inicio { get; set; }
    public DateTime Fin { get; set; }
    public bool Disponible { get; set; } = true;
    public Medico Medico { get; set; } = null!;
}