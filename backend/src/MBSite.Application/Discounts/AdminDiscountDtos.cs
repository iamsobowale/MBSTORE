namespace MBSite.Application.Discounts;

public record AdminDiscountListItem(
    Guid Id,
    string Code,
    string Type,
    decimal Value,
    decimal? MinOrderAmount,
    int? MaxUsage,
    int UsageCount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    bool IsActive,
    DateTime CreatedAt);

public record AdminDiscountDetail(
    Guid Id,
    string Code,
    string Type,
    decimal Value,
    decimal? MinOrderAmount,
    int? MaxUsage,
    int UsageCount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    bool IsActive,
    DateTime CreatedAt);

public record UpsertDiscountRequest(
    string Code,
    string Type,
    decimal Value,
    decimal? MinOrderAmount,
    int? MaxUsage,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    bool IsActive);
