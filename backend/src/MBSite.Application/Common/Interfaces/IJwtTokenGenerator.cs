using MBSite.Domain.Identity;

namespace MBSite.Application.Common.Interfaces;

public record TokenResult(string Token, DateTime ExpiresAt);

public interface IJwtTokenGenerator
{
    TokenResult Generate(User user);
}
