using System.Text;
using System.Text.RegularExpressions;

namespace MBSite.Application.Common;

public static partial class Slug
{
    /// <summary>Converts a display name into a URL-safe slug (lowercase, hyphenated).</summary>
    public static string From(string input)
    {
        var normalized = input.Trim().ToLowerInvariant();
        normalized = NonAlphanumeric().Replace(normalized, "-");
        normalized = MultiHyphen().Replace(normalized, "-").Trim('-');
        return normalized.Length == 0 ? Guid.NewGuid().ToString("N")[..8] : normalized;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();

    [GeneratedRegex("-{2,}")]
    private static partial Regex MultiHyphen();
}
