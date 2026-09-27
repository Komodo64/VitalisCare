namespace CitasMedicas.Web.Controllers;

using CitasMedicas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController, Route("api/medicos")]
public class MedicosController(IUsuarioService usuarioService) : ControllerBase
{
    [AllowAnonymous, HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var medicos = await usuarioService.ObtenerMedicosAsync(cancellationToken);
        return Ok(medicos.Select(m => new
        {
            m.Id,
            m.Especialidad,
            m.NumeroLicencia,
            Nombre = m.Usuario.NombreCompleto,
            Disponibilidades = m.Disponibilidades.Select(d => new { d.Id, d.Inicio, d.Fin, d.Disponible })
        }));
    }
}