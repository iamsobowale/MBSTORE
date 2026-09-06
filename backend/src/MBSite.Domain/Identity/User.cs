using MBSite.Domain.Common;

namespace MBSite.Domain.Identity;

public enum UserRole
{
    Staff = 0,
    Admin = 1,
    SuperAdmin = 2
}

/// <summary>An administrative user (admin/staff). Customers are modeled separately.</summary>
public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Admin;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}
