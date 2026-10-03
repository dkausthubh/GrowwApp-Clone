using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GrowwClone.Application.Auth;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GrowwClone.Infrastructure.Services;

public class AuthService : IAuthService
{
    private const decimal WelcomeBalance = 100000m;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return new AuthResult(false, "Email is already registered.", null);

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Wallet = new Wallet { Balance = WelcomeBalance }
        };
        user.Wallet.Transactions.Add(new WalletTransaction
        {
            Type = WalletTransactionType.Credit,
            Amount = WelcomeBalance,
            Description = "Welcome bonus (virtual money)"
        });

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResult(true, null, await IssueTokensAsync(user));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return new AuthResult(false, "Invalid email or password.", null);

        return new AuthResult(true, null, await IssueTokensAsync(user));
    }

    public async Task<UserDto?> GetMeAsync(int userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Wallet!.Balance))
            .FirstOrDefaultAsync();
    }

    public async Task<AuthResult> RefreshAsync(RefreshRequest request)
    {
        var hash = Hash(request.RefreshToken);
        var stored = await _db.RefreshTokens.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == hash);

        if (stored is null)
            return new AuthResult(false, "Invalid refresh token.", null);

        if (stored.RevokedAt is not null)
        {
            // Reuse of an already-rotated token: likely theft. Revoke the whole
            // family (every token for this user) and force a fresh login.
            await RevokeAllForUserAsync(stored.UserId);
            return new AuthResult(false, "Session invalidated. Please log in again.", null);
        }

        if (stored.ExpiresAt <= DateTime.UtcNow)
            return new AuthResult(false, "Refresh token expired. Please log in again.", null);

        var user = await _db.Users.FirstAsync(u => u.Id == stored.UserId);
        var newTokens = await IssueTokensAsync(user);

        stored.RevokedAt = DateTime.UtcNow;
        stored.ReplacedByHash = Hash(newTokens.RefreshToken);
        await _db.SaveChangesAsync();

        return new AuthResult(true, null, newTokens);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var hash = Hash(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    private async Task RevokeAllForUserAsync(int userId)
    {
        await _db.RefreshTokens
            .Where(r => r.UserId == userId && r.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.RevokedAt, DateTime.UtcNow));
    }

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(jwt["ExpiryMinutes"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.FullName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"], audience: jwt["Audience"],
            claims: claims, expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();
        var refreshDays = double.Parse(jwt["RefreshTokenDays"] ?? "7");

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = Hash(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays)
        });
        await _db.SaveChangesAsync();

        return new AuthResponse(accessToken, expires, refreshToken, user.FullName, user.Email);
    }

    private static string GenerateRefreshToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    private static string Hash(string value) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}