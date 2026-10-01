using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
        await _db.SaveChangesAsync();   // one SaveChanges = one transaction (user + wallet + txn)

        return new AuthResult(true, null, BuildToken(user));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return new AuthResult(false, "Invalid email or password.", null);

        return new AuthResult(true, null, BuildToken(user));
    }

    public async Task<UserDto?> GetMeAsync(int userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Wallet!.Balance))
            .FirstOrDefaultAsync();
    }

    private AuthResponse BuildToken(User user)
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
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token),
            expires, user.FullName, user.Email);
    }
}