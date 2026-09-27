namespace CitasMedicas.Infrastructure.Repositories;

using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;
using CitasMedicas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class CitaRepository(ApplicationDbContext db) : Repository<Cita>(db), ICitaRepository
{
    public override Task<Cita?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => Db.Citas.Include(x => x.Medico).ThenInclude(x => x.Usuario).Include(x => x.Paciente).ThenInclude(x => x.Usuario).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Cita>> GetByPacienteAsync(int pacienteId, CancellationToken cancellationToken = default)
        => await Db.Citas.AsNoTracking().Include(x => x.Medico).ThenInclude(x => x.Usuario).Include(x => x.Paciente).ThenInclude(x => x.Usuario).Where(x => x.PacienteId == pacienteId).OrderBy(x => x.Inicio).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Cita>> GetByMedicoAsync(int medicoId, DateTime? desde = null, CancellationToken cancellationToken = default)
        => await Db.Citas.AsNoTracking().Include(x => x.Medico).ThenInclude(x => x.Usuario).Include(x => x.Paciente).ThenInclude(x => x.Usuario).Where(x => x.MedicoId == medicoId && (!desde.HasValue || x.Inicio >= desde.Value)).OrderBy(x => x.Inicio).ToListAsync(cancellationToken);

    public Task<bool> HasOverlapAsync(int medicoId, DateTime inicio, DateTime fin, int? excludedId = null, CancellationToken cancellationToken = default)
        => Db.Citas.AnyAsync(x => x.MedicoId == medicoId && x.Estado != EstadoCita.Cancelada && (!excludedId.HasValue || x.Id != excludedId.Value) && inicio < x.Fin && fin > x.Inicio, cancellationToken);

    public async Task<bool> ReserveAvailabilityAsync(int medicoId, DateTime inicio, DateTime fin, CancellationToken cancellationToken = default)
    {
        var slot = await Db.Disponibilidades.FirstOrDefaultAsync(x => x.MedicoId == medicoId && x.Disponible && x.Inicio <= inicio && x.Fin >= fin, cancellationToken);
        if (slot is null) return false;
        Db.Disponibilidades.Remove(slot);
        if (slot.Inicio < inicio) Db.Disponibilidades.Add(new DisponibilidadMedica { MedicoId = medicoId, Inicio = slot.Inicio, Fin = inicio });
        if (fin < slot.Fin) Db.Disponibilidades.Add(new DisponibilidadMedica { MedicoId = medicoId, Inicio = fin, Fin = slot.Fin });
        return true;
    }
}