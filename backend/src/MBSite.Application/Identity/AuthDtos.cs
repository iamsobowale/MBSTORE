namespace MBSite.Application.Identity;

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, DateTime ExpiresAt, string Email, string Role);
