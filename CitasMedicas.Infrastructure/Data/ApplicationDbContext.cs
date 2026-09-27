namespace CitasMedicas.Infrastructure.Data;

using CitasMedicas.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Medico> Medicos => Set<Medico>();
    public DbSet<Paciente> Pacientes => Set<Paciente>();
    public DbSet<Cita> Citas => Set<Cita>();
    public DbSet<DisponibilidadMedica> Disponibilidades => Set<DisponibilidadMedica>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Rol).HasConversion<string>();
            entity.HasOne(x => x.Medico).WithOne(x => x.Usuario).HasForeignKey<Medico>(x => x.UsuarioId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Paciente).WithOne(x => x.Usuario).HasForeignKey<Paciente>(x => x.UsuarioId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Medico>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.NumeroLicencia).IsUnique();
            entity.Property(x => x.Especialidad).HasMaxLength(120).IsRequired();
        });
        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.NumeroDocumento).HasMaxLength(50);
            entity.Property(x => x.DocumentoUrl).HasMaxLength(500);
        });
        modelBuilder.Entity<Cita>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Estado).HasConversion<string>();
            entity.HasOne(x => x.Medico).WithMany(x => x.Citas).HasForeignKey(x => x.MedicoId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Paciente).WithMany(x => x.Citas).HasForeignKey(x => x.PacienteId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<DisponibilidadMedica>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.Medico).WithMany(x => x.Disponibilidades).HasForeignKey(x => x.MedicoId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Notificacion>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasOne(x => x.Cita).WithMany(x => x.Notificaciones).HasForeignKey(x => x.CitaId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}