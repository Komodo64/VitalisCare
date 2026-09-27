# Plataforma de Gestion de Citas Medicas

Solucion .NET 8 por capas: Domain, Application, Infrastructure y Web API. Usa SQLite por defecto para desarrollo local y EF Core puede cambiarse a SQL Server sustituyendo el proveedor y la cadena de conexion.

Consulta la [documentacion tecnica](docs/ARQUITECTURA.md) para conocer la arquitectura, entidades, reglas de negocio, base de datos, autenticacion y ejemplos de uso de la API.

## Comandos de creacion

```bash
mkdir CitasMedicas && cd CitasMedicas
dotnet new sln -n CitasMedicas --format sln
dotnet new classlib -n CitasMedicas.Domain -f net8.0
dotnet new classlib -n CitasMedicas.Application -f net8.0
dotnet new classlib -n CitasMedicas.Infrastructure -f net8.0
dotnet new webapi -n CitasMedicas.Web -f net8.0 --use-controllers --no-openapi
dotnet sln add CitasMedicas.Domain CitasMedicas.Application CitasMedicas.Infrastructure CitasMedicas.Web
dotnet add CitasMedicas.Application reference CitasMedicas.Domain
dotnet add CitasMedicas.Infrastructure reference CitasMedicas.Domain CitasMedicas.Application
dotnet add CitasMedicas.Web reference CitasMedicas.Domain CitasMedicas.Application CitasMedicas.Infrastructure
dotnet add CitasMedicas.Application package BCrypt.Net-Next --version 4.0.3
dotnet add CitasMedicas.Infrastructure package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.20
dotnet add CitasMedicas.Infrastructure package Microsoft.EntityFrameworkCore.Design --version 8.0.20
dotnet add CitasMedicas.Infrastructure package BCrypt.Net-Next --version 4.0.3
dotnet build
dotnet run --project CitasMedicas.Web
```

Con el SDK 10, si la plantilla de `classlib` no acepta `-f net8.0`, créala sin ese parámetro y cambia `TargetFramework` a `net8.0` en cada `.csproj`.

## Endpoints principales

- `POST /api/auth/login` y `POST /api/auth/logout`
- `GET /api/medicos`
- `POST /api/citas`, `GET /api/citas/{id}` y `POST /api/citas/{id}/cancelar`
- `GET /api/citas/paciente/{pacienteId}` y `GET /api/citas/medico/{medicoId}`
- `GET /api/dashboard/stats` para el rol Admin

Usuarios seed: `admin@citas.local` / `Admin123!`, `ana@citas.local` / `Medico123!`, `luis@citas.local` / `Medico123!`, `maria@citas.local` / `Paciente123!` y `carlos@citas.local` / `Paciente123!`.