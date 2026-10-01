using System.ComponentModel.DataAnnotations;

namespace GrowwClone.Application.Auth;

public class RegisterRequest
{
    [Required, MaxLength(100)] public string FullName { get; set; } = "";
    [Required, EmailAddress, MaxLength(200)] public string Email { get; set; } = "";
    [Required, MinLength(6), MaxLength(100)] public string Password { get; set; } = "";
}

public class LoginRequest
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public record AuthResponse(string Token, DateTime ExpiresAt, string FullName, string Email);

public record UserDto(int Id, string FullName, string Email, decimal WalletBalance);

public record AuthResult(bool Success, string? Error, AuthResponse? Data);

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<AuthResult> LoginAsync(LoginRequest request);
    Task<UserDto?> GetMeAsync(int userId);
}