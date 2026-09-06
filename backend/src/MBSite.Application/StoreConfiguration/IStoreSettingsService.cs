namespace MBSite.Application.StoreConfiguration;

public interface IStoreSettingsService
{
    /// <summary>Returns the current store settings, creating defaults if none exist.</summary>
    Task<StoreSettingsDto> GetAsync(CancellationToken ct = default);

    /// <summary>Updates the singleton store settings (admin only).</summary>
    Task<StoreSettingsDto> UpdateAsync(UpdateStoreSettingsRequest request, CancellationToken ct = default);
}
