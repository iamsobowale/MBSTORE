using MBSite.Domain.Common;

namespace MBSite.Domain.StoreConfiguration;

/// <summary>
/// Singleton store branding + theme configuration. The storefront theming system
/// (CSS variables) is generated from these values, so nothing brand-related is
/// hardcoded in the frontend. Default identity is premium black &amp; white.
/// </summary>
public class StoreSettings : BaseEntity
{
    public string BrandName { get; set; } = "MB";
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }

    // Theme colors (hex). Defaults: premium black & white.
    public string PrimaryColor { get; set; } = "#000000";
    public string SecondaryColor { get; set; } = "#111111";
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public string TextColor { get; set; } = "#000000";
    public string AccentColor { get; set; } = "#FFFFFF";
}
