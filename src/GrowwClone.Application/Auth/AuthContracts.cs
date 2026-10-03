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

public class RefreshRequest
{
    [Required] public string RefreshToken { get; set; } = "";
}

public record AuthResponse(
    string Token, DateTime ExpiresAt, string RefreshToken,
    string FullName, string Email);

public record UserDto(int Id, string FullName, string Email, decimal WalletBalance);

public record AuthResult(bool Success, string? Error, AuthResponse? Data);


public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<LoginResult> LoginAsync(LoginRequest request);          // changed return type
    Task<UserDto?> GetMeAsync(int userId);
    Task<AuthResult> RefreshAsync(RefreshRequest request);
    Task LogoutAsync(string refreshToken);
    Task<AuthResult> VerifyOtpAsync(VerifyOtpRequest request);   // new
}
public class VerifyOtpRequest
{
    [Required] public string MfaToken { get; set; } = "";
    [Required, StringLength(6, MinimumLength = 6)] public string Code { get; set; } = "";
}

public record MfaChallenge(string MfaToken, DateTime ExpiresAt, string? DevCode);

public record LoginResult(bool Success, string? Error, bool RequiresMfa, MfaChallenge? Challenge, AuthResponse? Data);