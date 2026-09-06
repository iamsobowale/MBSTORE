using MBSite.Application.Common;

namespace MBSite.Application.Catalog;

public interface ICatalogService
{
    /// <summary>Public product listing (Published only) with filtering, sorting, paging.</summary>
    Task<PagedResult<ProductListItemDto>> ListAsync(ProductQuery query, CancellationToken ct = default);

    /// <summary>Public product detail by slug. Returns null if missing or not Published.</summary>
    Task<ProductDetailDto?> GetBySlugAsync(string slug, CancellationToken ct = default);

    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
}
