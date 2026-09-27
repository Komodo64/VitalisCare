namespace CitasMedicas.Application.DTOs;

public record CitaCreateDto(int MedicoId, int PacienteId, DateTime Inicio, DateTime Fin, string Motivo);