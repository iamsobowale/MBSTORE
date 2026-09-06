namespace MBSite.Application.StoreConfiguration;

/// <summary>Public-facing store theme + branding. Safe to expose to the storefront.</summary>
public record StoreSettingsDto(
    string BrandName,
    string? LogoUrl,
    string? FaviconUrl,
    string PrimaryColor,
    string SecondaryColor,
    string BackgroundColor,
    string TextColor,
    string AccentColor);

/// <summary>Admin update payload for store branding + theme.</summary>
public record UpdateStoreSettingsRequest(
    string BrandName,
    string? LogoUrl,
    string? FaviconUrl,
    string PrimaryColor,
    string SecondaryColor,
    string BackgroundColor,
    string TextColor,
    string AccentColor);
