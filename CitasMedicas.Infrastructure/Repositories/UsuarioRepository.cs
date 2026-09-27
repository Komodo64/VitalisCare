namespace CitasMedicas.Infrastructure.Repositories;

using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Interfaces;
using CitasMedicas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class UsuarioRepository(ApplicationDbContext db) : Repository<Usuario>(db), IUsuarioRepository
{
    public override Task<Usuario?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => Db.Usuarios.Include(x => x.Medico).Include(x => x.Paciente).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Usuario?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => Db.Usuarios.Include(x => x.Medico).Include(x => x.Paciente).FirstOrDefaultAsync(x => x.Email == email.ToLower(), cancellationToken);
    public Task<Medico?> GetMedicoByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
        => Db.Medicos.Include(x => x.Usuario).FirstOrDefaultAsync(x => x.UsuarioId == usuarioId || x.Id == usuarioId, cancellationToken);
    public Task<Paciente?> GetPacienteByUsuarioIdAsync(int usuarioId, CancellationToken cancellationToken = default)
        => Db.Pacientes.Include(x => x.Usuario).FirstOrDefaultAsync(x => x.UsuarioId == usuarioId || x.Id == usuarioId, cancellationToken);
    public async Task<IReadOnlyList<Medico>> GetMedicosAsync(CancellationToken cancellationToken = default)
        => await Db.Medicos.AsNoTracking().Include(x => x.Usuario).Include(x => x.Disponibilidades).OrderBy(x => x.Usuario.NombreCompleto).ToListAsync(cancellationToken);
}