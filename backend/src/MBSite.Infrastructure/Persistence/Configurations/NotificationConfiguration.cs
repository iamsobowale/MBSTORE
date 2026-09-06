using MBSite.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MBSite.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Channel).HasConversion<int>();
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.Recipient).HasMaxLength(256).IsRequired();
        builder.Property(x => x.TemplateKey).HasMaxLength(80).IsRequired();
        builder.Property(x => x.EventKey).HasMaxLength(120).IsRequired();

        // Idempotency: a given order+status is enqueued (and thus sent) at most once.
        builder.HasIndex(x => x.EventKey).IsUnique();
        builder.HasIndex(x => x.Status);
    }
}
