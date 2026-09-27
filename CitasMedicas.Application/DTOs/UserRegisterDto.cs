namespace CitasMedicas.Application.DTOs;

public record UserRegisterDto(
    string NombreCompleto,
    string Email,
    string Password,
    DateOnly FechaNacimiento,
    string Telefono,
    string? NumeroDocumento = null,
    string? DocumentoUrl = null
);
