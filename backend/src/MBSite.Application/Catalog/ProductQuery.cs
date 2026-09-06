namespace MBSite.Application.Catalog;

public enum ProductSort
{
    Newest = 0,
    PriceAsc = 1,
    PriceDesc = 2,
    BestSelling = 3
}

/// <summary>Filtering/sorting/paging options for the shop listing.</summary>
public record ProductQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
    public string? Search { get; init; }
    public string? CategorySlug { get; init; }
    public string? Size { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }

    /// <summary>When true, only products with at least one available variant.</summary>
    public bool? InStockOnly { get; init; }

    public ProductSort Sort { get; init; } = ProductSort.Newest;

    /// <summary>Clamp paging to sane bounds regardless of caller input.</summary>
    public ProductQuery Normalized() => this with
    {
        Page = Page < 1 ? 1 : Page,
        PageSize = PageSize is < 1 or > 60 ? 12 : PageSize
    };
}
