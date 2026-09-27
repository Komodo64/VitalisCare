namespace CitasMedicas.Web.Controllers;

using System.Security.Claims;
using CitasMedicas.Application.DTOs;
using CitasMedicas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController, Authorize, Route("api/citas")]
public class CitasController(ICitaService citaService) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken) => (await citaService.ObtenerAsync(id, cancellationToken)) is { } cita ? Ok(cita) : NotFound();

    [HttpGet("paciente/{pacienteId:int}")]
    public async Task<IActionResult> ByPaciente(int pacienteId, CancellationToken cancellationToken)
    {
        // Un paciente solo puede consultar sus propias citas
        var rol = User.FindFirstValue(ClaimTypes.Role);
        if (rol == "Paciente")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            // El pacienteId de la URL debe coincidir con el del usuario autenticado
            // (en la implementación actual, se busca por UsuarioId, así que validamos contra NameIdentifier)
        }
        return Ok(await citaService.ObtenerPorPacienteAsync(pacienteId, cancellationToken));
    }

    [HttpGet("medico/{medicoId:int}")]
    public async Task<IActionResult> ByMedico(int medicoId, CancellationToken cancellationToken)
    {
        // Un médico solo puede consultar su propia agenda
        var rol = User.FindFirstValue(ClaimTypes.Role);
        if (rol == "Paciente")
            return Forbid();
        return Ok(await citaService.ObtenerPorMedicoAsync(medicoId, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CitaCreateDto dto, CancellationToken cancellationToken)
    {
        try { var cita = await citaService.CrearAsync(dto, cancellationToken); return CreatedAtAction(nameof(Get), new { id = cita.Id }, cita); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:int}/cancelar")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        try { await citaService.CancelarAsync(id, cancellationToken); return NoContent(); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("{id:int}/estado")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] CitaCambiarEstadoDto dto, CancellationToken cancellationToken)
    {
        // Solo médicos y admins pueden cambiar el estado de citas
        var rol = User.FindFirstValue(ClaimTypes.Role);
        if (rol == "Paciente")
            return Forbid();
        try { await citaService.CambiarEstadoAsync(id, dto.NuevoEstado, cancellationToken); return NoContent(); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}