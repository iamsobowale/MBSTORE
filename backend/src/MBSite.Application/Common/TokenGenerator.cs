using System.Security.Cryptography;

namespace MBSite.Application.Common;

public static class TokenGenerator
{
    private const string RefAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

    /// <summary>Cryptographically-random URL-safe token (for cart / order tracking).</summary>
    public static string UrlSafe(int bytes = 32) =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(bytes))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

    /// <summary>Short human-friendly, non-sequential order reference, e.g. MB-7Q3K9F.</summary>
    public static string OrderReference()
    {
        Span<char> chars = stackalloc char[6];
        for (var i = 0; i < chars.Length; i++)
            chars[i] = RefAlphabet[RandomNumberGenerator.GetInt32(RefAlphabet.Length)];
        return "MB-" + new string(chars);
    }
}
