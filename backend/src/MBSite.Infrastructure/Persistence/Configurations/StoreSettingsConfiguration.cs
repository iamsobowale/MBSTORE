using MBSite.Domain.StoreConfiguration;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MBSite.Infrastructure.Persistence.Configurations;

public class StoreSettingsConfiguration : IEntityTypeConfiguration<StoreSettings>
{
    public void Configure(EntityTypeBuilder<StoreSettings> builder)
    {
        builder.ToTable("store_settings");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.BrandName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.LogoUrl).HasMaxLength(2048);
        builder.Property(x => x.FaviconUrl).HasMaxLength(2048);

        foreach (var color in new[] { nameof(StoreSettings.PrimaryColor), nameof(StoreSettings.SecondaryColor),
                     nameof(StoreSettings.BackgroundColor), nameof(StoreSettings.TextColor), nameof(StoreSettings.AccentColor) })
        {
            builder.Property(color).HasMaxLength(9).IsRequired(); // e.g. #RRGGBBAA
        }
    }
}
