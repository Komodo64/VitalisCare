namespace CitasMedicas.Application.Services;

using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Interfaces;
using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;

public class CitaService(ICitaRepository citaRepository, IUsuarioRepository usuarioRepository) : ICitaService
{
    public async Task<CitaReadDto> CrearAsync(CitaCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Inicio >= dto.Fin)
            throw new ArgumentException("La hora de inicio debe ser anterior a la hora de fin.");
        if (dto.Inicio <= DateTime.Now)
            throw new ArgumentException("La cita debe programarse en el futuro.");

        // Validar y sanitizar el motivo de consulta
        var motivo = dto.Motivo?.Replace("\0", "").Trim() ?? "";
        if (string.IsNullOrWhiteSpace(motivo))
            throw new ArgumentException("El motivo de la consulta es obligatorio.");
        if (motivo.Length > 500)
            motivo = motivo[..500];

        if (await citaRepository.HasOverlapAsync(dto.MedicoId, dto.Inicio, dto.Fin, cancellationToken: cancellationToken))
            throw new InvalidOperationException("El médico ya tiene una cita en ese horario.");
        if (!await citaRepository.ReserveAvailabilityAsync(dto.MedicoId, dto.Inicio, dto.Fin, cancellationToken))
            throw new InvalidOperationException("El horario seleccionado no está disponible.");

        var medico = await usuarioRepository.GetMedicoByUsuarioIdAsync(dto.MedicoId, cancellationToken)
            ?? throw new KeyNotFoundException("Médico no encontrado.");
        var paciente = await usuarioRepository.GetPacienteByUsuarioIdAsync(dto.PacienteId, cancellationToken)
            ?? throw new KeyNotFoundException("Paciente no encontrado.");
        var cita = new Cita { MedicoId = medico.Id, PacienteId = paciente.Id, Inicio = dto.Inicio, Fin = dto.Fin, Motivo = motivo };
        await citaRepository.AddAsync(cita, cancellationToken);
        await citaRepository.SaveChangesAsync(cancellationToken);
        return ToDto(cita, medico, paciente);
    }

    public async Task<IReadOnlyList<CitaReadDto>> ObtenerPorPacienteAsync(int pacienteId, CancellationToken cancellationToken = default)
        => (await citaRepository.GetByPacienteAsync(pacienteId, cancellationToken)).Select(ToDto).ToList();

    public async Task<IReadOnlyList<CitaReadDto>> ObtenerPorMedicoAsync(int medicoId, CancellationToken cancellationToken = default)
        => (await citaRepository.GetByMedicoAsync(medicoId, cancellationToken: cancellationToken)).Select(ToDto).ToList();

    public async Task<CitaReadDto?> ObtenerAsync(int id, CancellationToken cancellationToken = default)
    {
        var cita = await citaRepository.GetByIdAsync(id, cancellationToken);
        return cita is null ? null : ToDto(cita);
    }

    public async Task CancelarAsync(int id, CancellationToken cancellationToken = default)
    {
        var cita = await citaRepository.GetByIdAsync(id, cancellationToken) ?? throw new KeyNotFoundException("Cita no encontrada.");
        if (cita.Estado is EstadoCita.Cancelada or EstadoCita.Completada)
            throw new InvalidOperationException("La cita no puede cancelarse en su estado actual.");
        if (cita.Inicio <= DateTime.Now.AddHours(24))
            throw new InvalidOperationException("La cancelación debe hacerse con al menos 24 horas de anticipación.");
        cita.Estado = EstadoCita.Cancelada;
        citaRepository.Update(cita);
        await citaRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task CambiarEstadoAsync(int id, EstadoCita nuevoEstado, CancellationToken cancellationToken = default)
    {
        var cita = await citaRepository.GetByIdAsync(id, cancellationToken) ?? throw new KeyNotFoundException("Cita no encontrada.");
        if (cita.Estado == EstadoCita.Cancelada && nuevoEstado != EstadoCita.Cancelada)
            throw new InvalidOperationException("No se puede modificar una cita cancelada.");
        cita.Estado = nuevoEstado;
        citaRepository.Update(cita);
        await citaRepository.SaveChangesAsync(cancellationToken);
    }

    private static CitaReadDto ToDto(Cita cita) => ToDto(cita, cita.Medico, cita.Paciente);
    private static CitaReadDto ToDto(Cita cita, Medico medico, Paciente paciente)
        => new(cita.Id, medico.Id, medico.Usuario.NombreCompleto, paciente.Id, paciente.Usuario.NombreCompleto, cita.Inicio, cita.Fin, cita.Motivo, cita.Estado, paciente.NumeroDocumento, paciente.DocumentoUrl);
}