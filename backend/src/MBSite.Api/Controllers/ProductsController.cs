using MBSite.Application.Catalog;
using MBSite.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[AllowAnonymous]
public class ProductsController : ControllerBase
{
    private readonly ICatalogService _catalog;

    public ProductsController(ICatalogService catalog) => _catalog = catalog;

    /// <summary>Public product listing with filtering, sorting, and pagination.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? size = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? inStock = null,
        [FromQuery] ProductSort sort = ProductSort.Newest,
        CancellationToken ct = default)
    {
        var query = new ProductQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            CategorySlug = category,
            Size = size,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            InStockOnly = inStock,
            Sort = sort
        };
        return Ok(await _catalog.ListAsync(query, ct));
    }

    /// <summary>Public product detail by slug.</summary>
    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDetailDto>> GetBySlug(string slug, CancellationToken ct)
    {
        var product = await _catalog.GetBySlugAsync(slug, ct);
        return product is null ? NotFound() : Ok(product);
    }
}
