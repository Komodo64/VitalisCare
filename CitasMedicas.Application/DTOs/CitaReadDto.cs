namespace CitasMedicas.Application.DTOs;

using CitasMedicas.Domain.Enums;

public record CitaReadDto(int Id, int MedicoId, string Medico, int PacienteId, string Paciente,
    DateTime Inicio, DateTime Fin, string Motivo, EstadoCita Estado,
    string? NumeroDocumento = null, string? DocumentoUrl = null);