using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using GrowwClone.Application.Auth;
using GrowwClone.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Hosting;
using GrowwClone.Application.Audit;

namespace GrowwClone.Infrastructure.Services;

public class AuthService : IAuthService
{
    private const decimal WelcomeBalance = 100000m;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IHostEnvironment _env;
    private readonly IAuditLogger _audit;

    public AuthService(AppDbContext db, IConfiguration config, IHostEnvironment env, IAuditLogger audit)
    {
        _db = db;
        _config = config;
        _env = env;
        _audit = audit;
    }
    public AuthService(AppDbContext db, IConfiguration config, IHostEnvironment env)
    {
        _db = db;
        _config = config;
        _env = env;
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
        await _audit.LogAsync(user.Id, "Register", $"New account created: {user.Email}");

        return new AuthResult(true, null, await IssueTokensAsync(user));
    }

  public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

       if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await _audit.LogAsync(user?.Id, "LoginFailed", $"Failed login attempt for {email}");
            return new LoginResult(false, "Invalid email or password.", false, null, null);
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var sessionToken = GenerateRefreshToken();   // reuse the same random-token helper
        var expires = DateTime.UtcNow.AddMinutes(5);

        _db.OtpCodes.Add(new OtpCode
        {
            UserId = user.Id,
            CodeHash = Hash(code),
            SessionTokenHash = Hash(sessionToken),
            ExpiresAt = expires
        });
        await _db.SaveChangesAsync();
        await _audit.LogAsync(user.Id, "LoginOtpSent", "Password verified, OTP challenge issued");

        // Dev-only: no email provider configured yet, so log instead of sending.
        // will Swap this for a real provider (SendGrid, Azure Communication Services, etc.) later.
        Console.WriteLine($"[DEV] OTP for {user.Email}: {code} (expires {expires:HH:mm:ss} UTC)");

        var challenge = new MfaChallenge(sessionToken, expires, _env.IsDevelopment() ? code : null);
        return new LoginResult(true, null, true, challenge, null);
    }
    public async Task<AuthResult> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var sessionHash = Hash(request.MfaToken);
        var otp = await _db.OtpCodes.FirstOrDefaultAsync(o => o.SessionTokenHash == sessionHash);
    
        if (otp is null || otp.ConsumedAt is not null)
        {
            await _audit.LogAsync(null, "OtpFailed", "Invalid or reused MFA session token");
            return new AuthResult(false, "Invalid or already-used login session. Please log in again.", null);
        }

        if (otp.ExpiresAt <= DateTime.UtcNow)
        {
            await _audit.LogAsync(otp.UserId, "OtpFailed", "Expired OTP code");
            return new AuthResult(false, "Code expired. Please log in again.", null);
        }

        if (otp.CodeHash != Hash(request.Code))
        {
            await _audit.LogAsync(otp.UserId, "OtpFailed", "Incorrect OTP code entered");
            return new AuthResult(false, "Incorrect code.", null);
        }
        otp.ConsumedAt = DateTime.UtcNow;   // one-time use
        await _db.SaveChangesAsync();
        await _audit.LogAsync(otp.UserId, "LoginSuccess", "MFA verified, tokens issued");
        
        var user = await _db.Users.FirstAsync(u => u.Id == otp.UserId);
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
            await RevokeAllForUserAsync(stored.UserId);
            await _audit.LogAsync(stored.UserId, "RefreshTokenReuseDetected", "Possible token theft — all sessions revoked");
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
            await _audit.LogAsync(stored.UserId, "Logout", "User logged out, refresh token revoked");
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