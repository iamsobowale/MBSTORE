namespace MBSite.Domain.Common;

/// <summary>
/// Base type for all persistent entities. Uses a GUID primary key so we never
/// expose sequential identifiers to the outside world.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
