using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using GrowwClone.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GrowwClone.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _auth.RegisterAsync(request);
        return result.Success ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }   

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        if (!result.Success) return Unauthorized(new { error = result.Error });
        return Ok(new { requiresMfa = true, challenge = result.Challenge });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(VerifyOtpRequest request)
    {
        var result = await _auth.VerifyOtpAsync(request);
        return result.Success ? Ok(result.Data) : Unauthorized(new { error = result.Error });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request)
    {
        var result = await _auth.RefreshAsync(request);
        return result.Success ? Ok(result.Data) : Unauthorized(new { error = result.Error });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest request)
    {
        await _auth.LogoutAsync(request.RefreshToken);
        return Ok();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!int.TryParse(id, out var userId)) return Unauthorized();

        var me = await _auth.GetMeAsync(userId);
        return me is null ? NotFound() : Ok(me);
    }
}