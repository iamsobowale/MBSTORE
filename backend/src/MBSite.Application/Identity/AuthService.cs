using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Identity;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
}

public class AuthService : IAuthService
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenGenerator _tokens;

    public AuthService(IAppDbContext db, IPasswordHasher hasher, IJwtTokenGenerator tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Same generic error whether the email exists or the password is wrong, so we
        // don't leak which accounts exist. Verify against a hash either way.
        var ok = user is { IsActive: true } && _hasher.Verify(request.Password, user.PasswordHash);
        if (!ok)
            throw new UnauthorizedException("Invalid email or password.");

        user!.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var token = _tokens.Generate(user);
        return new AuthResponse(token.Token, token.ExpiresAt, user.Email, user.Role.ToString());
    }
}
