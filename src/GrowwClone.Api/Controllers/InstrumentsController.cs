using GrowwClone.Application.Market;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrowwClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/instruments")]
public class InstrumentsController : ControllerBase
{
    private readonly IMarketService _market;
    public InstrumentsController(IMarketService market) => _market = market;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? type)
        => Ok(await _market.GetInstrumentsAsync(search, type));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _market.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }
}