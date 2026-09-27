namespace CitasMedicas.Infrastructure.Data;

using CitasMedicas.Domain.Entities;
using CitasMedicas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        if (await db.Usuarios.AnyAsync()) return;

        var admin = new Usuario { NombreCompleto = "Administrador", Email = "admin@citas.local", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"), Rol = RolUsuario.Admin };
        var doctor1User = new Usuario { NombreCompleto = "Dra. Ana García", Email = "ana@citas.local", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Medico123!"), Rol = RolUsuario.Medico };
        var doctor2User = new Usuario { NombreCompleto = "Dr. Luis Pérez", Email = "luis@citas.local", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Medico123!"), Rol = RolUsuario.Medico };
        var patient1User = new Usuario { NombreCompleto = "María López", Email = "maria@citas.local", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Paciente123!"), Rol = RolUsuario.Paciente };
        var patient2User = new Usuario { NombreCompleto = "Carlos Ruiz", Email = "carlos@citas.local", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Paciente123!"), Rol = RolUsuario.Paciente };
        db.Usuarios.AddRange(admin, doctor1User, doctor2User, patient1User, patient2User);
        await db.SaveChangesAsync();

        var doctors = new[] { new Medico { UsuarioId = doctor1User.Id, Especialidad = "Cardiología", NumeroLicencia = "MED-1001" }, new Medico { UsuarioId = doctor2User.Id, Especialidad = "Dermatología", NumeroLicencia = "MED-1002" } };
        var patients = new[] {
            new Paciente { UsuarioId = patient1User.Id, FechaNacimiento = new DateOnly(1990, 5, 12), Telefono = "555-0101", NumeroDocumento = "1020304050", DocumentoUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg" },
            new Paciente { UsuarioId = patient2User.Id, FechaNacimiento = new DateOnly(1985, 8, 22), Telefono = "555-0102", NumeroDocumento = "9876543210", DocumentoUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg" }
        };
        db.Medicos.AddRange(doctors); db.Pacientes.AddRange(patients); await db.SaveChangesAsync();
        var day = DateTime.Today.AddDays(1);
        foreach (var doctor in doctors)
            for (var offset = 0; offset < 5; offset++)
                db.Disponibilidades.Add(new DisponibilidadMedica { MedicoId = doctor.Id, Inicio = day.AddDays(offset).AddHours(9), Fin = day.AddDays(offset).AddHours(17) });
        await db.SaveChangesAsync();
    }
}