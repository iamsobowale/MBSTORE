using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Promotions;
using Microsoft.EntityFrameworkCore;

namespace MBSite.Application.Discounts;

public interface IAdminDiscountService
{
    Task<PagedResult<AdminDiscountListItem>> ListAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<AdminDiscountDetail> GetAsync(Guid id, CancellationToken ct = default);
    Task<AdminDiscountDetail> CreateAsync(UpsertDiscountRequest req, CancellationToken ct = default);
    Task<AdminDiscountDetail> UpdateAsync(Guid id, UpsertDiscountRequest req, CancellationToken ct = default);
    Task ToggleActiveAsync(Guid id, bool active, CancellationToken ct = default);
}

public class AdminDiscountService : IAdminDiscountService
{
    private readonly IAppDbContext _db;

    public AdminDiscountService(IAppDbContext db) => _db = db;

    public async Task<PagedResult<AdminDiscountListItem>> ListAsync(int page, int pageSize, string? search, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Discounts.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToUpper();
            query = query.Where(d => d.Code.ToUpper().Contains(term));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new AdminDiscountListItem(
                d.Id, d.Code, d.Type.ToString(), d.Value,
                d.MinOrderAmount, d.MaxUsage, d.UsageCount,
                d.StartsAt, d.ExpiresAt, d.IsActive, d.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<AdminDiscountListItem>(items, page, pageSize, total);
    }

    public async Task<AdminDiscountDetail> GetAsync(Guid id, CancellationToken ct = default)
    {
        var d = await _db.Discounts.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundException("Discount not found.");
        return Map(d);
    }

    public async Task<AdminDiscountDetail> CreateAsync(UpsertDiscountRequest req, CancellationToken ct = default)
    {
        var code = req.Code.Trim().ToUpperInvariant();
        if (await _db.Discounts.AnyAsync(d => d.Code == code, ct))
            throw new ConflictException($"A discount with code '{code}' already exists.");

        var discount = new Discount
        {
            Code = code,
            Type = ParseType(req.Type),
            Value = req.Value,
            MinOrderAmount = req.MinOrderAmount,
            MaxUsage = req.MaxUsage,
            StartsAt = req.StartsAt?.ToUniversalTime(),
            ExpiresAt = req.ExpiresAt?.ToUniversalTime(),
            IsActive = req.IsActive
        };

        _db.Discounts.Add(discount);
        await _db.SaveChangesAsync(ct);
        return Map(discount);
    }

    public async Task<AdminDiscountDetail> UpdateAsync(Guid id, UpsertDiscountRequest req, CancellationToken ct = default)
    {
        var discount = await _db.Discounts.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundException("Discount not found.");

        var code = req.Code.Trim().ToUpperInvariant();
        if (await _db.Discounts.AnyAsync(d => d.Code == code && d.Id != id, ct))
            throw new ConflictException($"A discount with code '{code}' already exists.");

        discount.Code = code;
        discount.Type = ParseType(req.Type);
        discount.Value = req.Value;
        discount.MinOrderAmount = req.MinOrderAmount;
        discount.MaxUsage = req.MaxUsage;
        discount.StartsAt = req.StartsAt?.ToUniversalTime();
        discount.ExpiresAt = req.ExpiresAt?.ToUniversalTime();
        discount.IsActive = req.IsActive;
        discount.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return Map(discount);
    }

    public async Task ToggleActiveAsync(Guid id, bool active, CancellationToken ct = default)
    {
        var discount = await _db.Discounts.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new NotFoundException("Discount not found.");
        discount.IsActive = active;
        discount.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private static DiscountType ParseType(string type) =>
        Enum.TryParse<DiscountType>(type, ignoreCase: true, out var t) ? t
            : throw new ValidationException($"Unknown discount type '{type}'.");

    private static AdminDiscountDetail Map(Discount d) => new(
        d.Id, d.Code, d.Type.ToString(), d.Value,
        d.MinOrderAmount, d.MaxUsage, d.UsageCount,
        d.StartsAt, d.ExpiresAt, d.IsActive, d.CreatedAt);
}
