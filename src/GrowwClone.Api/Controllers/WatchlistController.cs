using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GrowwClone.Application.Watchlist;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GrowwClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/watchlist")]
public class WatchlistController : ControllerBase
{
    private readonly IWatchlistService _watchlist;
    public WatchlistController(IWatchlistService watchlist) => _watchlist = watchlist;

    private int UserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _watchlist.GetAsync(UserId));

    [HttpPost("{instrumentId:int}")]
    public async Task<IActionResult> Add(int instrumentId)
    {
        var ok = await _watchlist.AddAsync(UserId, instrumentId);
        return ok ? Ok() : NotFound(new { error = "Instrument not found." });
    }

    [HttpDelete("{instrumentId:int}")]
    public async Task<IActionResult> Remove(int instrumentId)
    {
        var ok = await _watchlist.RemoveAsync(UserId, instrumentId);
        return ok ? Ok() : NotFound();
    }
}