namespace MBSite.Domain.Catalog;

/// <summary>
/// One measurement estimate for a size, e.g. size "L" → Chest 42 in. Dimensions are
/// free-form so admins can add Waist, Hips, Inseam, etc. Stored as JSON on the
/// product (owned collection) since it's only ever read alongside the product.
/// </summary>
public class SizeMeasurement
{
    public string Size { get; set; } = string.Empty;
    public string Dimension { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Unit { get; set; } = "in";
    public int SortOrder { get; set; }
}
