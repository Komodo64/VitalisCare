namespace CitasMedicas.Web.Controllers;

using System.Security.Claims;
using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController, Route("api/auth")]
public class AuthController(IUsuarioService usuarioService) : ControllerBase
{
    [AllowAnonymous, HttpPost("login")]
    public async Task<IActionResult> Login(UserLoginDto dto, CancellationToken cancellationToken)
    {
        var usuario = await usuarioService.AutenticarAsync(dto, cancellationToken);
        if (usuario is null) return Unauthorized(new { message = "Credenciales inválidas." });
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()), new Claim(ClaimTypes.Name, usuario.NombreCompleto), new Claim(ClaimTypes.Email, usuario.Email), new Claim(ClaimTypes.Role, usuario.Rol.ToString()) };
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
        return Ok(new
        {
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Email,
            Rol = usuario.Rol.ToString(),
            PacienteId = usuario.Paciente?.Id,
            MedicoId = usuario.Medico?.Id
        });
    }

    [AllowAnonymous, HttpPost("register")]
    public async Task<IActionResult> Register(UserRegisterDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var usuario = await usuarioService.RegistrarPacienteAsync(dto, cancellationToken);
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()), new Claim(ClaimTypes.Name, usuario.NombreCompleto), new Claim(ClaimTypes.Email, usuario.Email), new Claim(ClaimTypes.Role, usuario.Rol.ToString()) };
            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
            return CreatedAtAction(nameof(Me), new
            {
                usuario.Id,
                usuario.NombreCompleto,
                usuario.Email,
                Rol = usuario.Rol.ToString(),
                PacienteId = usuario.Paciente?.Id
            });
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (idClaim is null || !int.TryParse(idClaim, out var id)) return Unauthorized();
        var usuario = await usuarioService.ObtenerPorIdAsync(id, cancellationToken);
        if (usuario is null) return NotFound();
        return Ok(new
        {
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Email,
            Rol = usuario.Rol.ToString(),
            PacienteId = usuario.Paciente?.Id,
            MedicoId = usuario.Medico?.Id
        });
    }

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout() { await HttpContext.SignOutAsync(); return NoContent(); }
}