namespace CitasMedicas.Infrastructure.Repositories;

using CitasMedicas.Domain.Interfaces;
using CitasMedicas.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public abstract class Repository<TEntity>(ApplicationDbContext db) : IRepository<TEntity> where TEntity : class
{
    protected readonly ApplicationDbContext Db = db;
    public virtual Task<TEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default) => Db.Set<TEntity>().FindAsync([id], cancellationToken).AsTask();
    public Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) => Db.Set<TEntity>().AddAsync(entity, cancellationToken).AsTask();
    public void Update(TEntity entity) => Db.Set<TEntity>().Update(entity);
    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Db.SaveChangesAsync(cancellationToken);
}