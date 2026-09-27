namespace CitasMedicas.Infrastructure.Repositories;

using CitasMedicas.Domain.Enums;
using CitasMedicas.Domain.Interfaces;
using CitasMedicas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class DashboardRepository(ApplicationDbContext db) : IDashboardRepository
{
    public async Task<DashboardCounts> GetCountsAsync(CancellationToken cancellationToken = default)
        => new(await db.Citas.CountAsync(cancellationToken), await db.Citas.CountAsync(x => x.Estado == EstadoCita.Pendiente, cancellationToken),
            await db.Citas.CountAsync(x => x.Estado == EstadoCita.Confirmada, cancellationToken), await db.Citas.CountAsync(x => x.Estado == EstadoCita.Completada, cancellationToken),
            await db.Medicos.CountAsync(cancellationToken), await db.Pacientes.CountAsync(cancellationToken));
}