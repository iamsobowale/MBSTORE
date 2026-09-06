using MBSite.Domain.Common;

namespace MBSite.Domain.Catalog;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; }

    public List<Product> Products { get; set; } = new();
}
