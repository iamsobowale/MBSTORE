using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Application.Identity;
using MBSite.Domain.Identity;
using MBSite.Infrastructure.Persistence;
using MBSite.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MBSite.Tests;

public class AuthServiceTests
{
    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private sealed class FakeTokenGenerator : IJwtTokenGenerator
    {
        public TokenResult Generate(User user) => new("token-for-" + user.Email, DateTime.UtcNow.AddHours(1));
    }

    private static async Task<AppDbContext> SeedUser(IPasswordHasher hasher, bool active = true)
    {
        var db = NewDb();
        db.Users.Add(new User
        {
            Email = "admin@mb.local",
            PasswordHash = hasher.Hash("Admin123!"),
            Role = UserRole.SuperAdmin,
            IsActive = active
        });
        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task Login_ReturnsToken_ForValidCredentials()
    {
        var hasher = new BcryptPasswordHasher();
        using var db = await SeedUser(hasher);
        var svc = new AuthService(db, hasher, new FakeTokenGenerator());

        var result = await svc.LoginAsync(new LoginRequest("admin@mb.local", "Admin123!"));

        Assert.Equal("admin@mb.local", result.Email);
        Assert.Equal("SuperAdmin", result.Role);
        Assert.StartsWith("token-for-", result.Token);
    }

    [Fact]
    public async Task Login_Throws_ForWrongPassword()
    {
        var hasher = new BcryptPasswordHasher();
        using var db = await SeedUser(hasher);
        var svc = new AuthService(db, hasher, new FakeTokenGenerator());

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            svc.LoginAsync(new LoginRequest("admin@mb.local", "wrong")));
    }

    [Fact]
    public async Task Login_Throws_ForInactiveUser()
    {
        var hasher = new BcryptPasswordHasher();
        using var db = await SeedUser(hasher, active: false);
        var svc = new AuthService(db, hasher, new FakeTokenGenerator());

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            svc.LoginAsync(new LoginRequest("admin@mb.local", "Admin123!")));
    }
}
