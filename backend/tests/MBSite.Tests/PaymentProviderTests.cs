using System.Security.Cryptography;
using System.Text;
using MBSite.Infrastructure.Payments;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace MBSite.Tests;

public class PaymentProviderTests
{
    private static IConfiguration Config(params (string, string)[] values) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(values.Select(v => new KeyValuePair<string, string?>(v.Item1, v.Item2)))
            .Build();

    [Fact]
    public void Paystack_VerifyWebhookSignature_AcceptsValidHmac()
    {
        const string secret = "sk_test_secret";
        var provider = new PaystackPaymentProvider(new HttpClient(), Config(("Payments:Paystack:SecretKey", secret)));
        var body = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"abc\"}}";

        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secret));
        var signature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(body))).ToLowerInvariant();

        Assert.True(provider.VerifyWebhookSignature(body, signature));
    }

    [Fact]
    public void Paystack_VerifyWebhookSignature_RejectsBadSignature()
    {
        var provider = new PaystackPaymentProvider(new HttpClient(), Config(("Payments:Paystack:SecretKey", "sk_test_secret")));
        Assert.False(provider.VerifyWebhookSignature("{\"a\":1}", "deadbeef"));
        Assert.False(provider.VerifyWebhookSignature("{\"a\":1}", null));
    }

    [Fact]
    public void Paystack_ParseWebhook_SuccessOnChargeSuccess()
    {
        var provider = new PaystackPaymentProvider(new HttpClient(), Config(("Payments:Paystack:SecretKey", "sk")));
        var body = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"REF1\",\"amount\":225000,\"currency\":\"NGN\"}}";

        var outcome = provider.ParseWebhook(body);

        Assert.True(outcome.Success);
        Assert.Equal("REF1", outcome.ProviderReference);
        Assert.Equal(2250m, outcome.Amount); // kobo → naira
    }

    [Fact]
    public void Paystack_ParseWebhook_NonSuccessEvent_IsNotSuccess()
    {
        var provider = new PaystackPaymentProvider(new HttpClient(), Config(("Payments:Paystack:SecretKey", "sk")));
        var outcome = provider.ParseWebhook("{\"event\":\"charge.failed\",\"data\":{\"reference\":\"REF2\"}}");
        Assert.False(outcome.Success);
    }

    [Fact]
    public void Fake_ParseWebhook_ReadsStatus()
    {
        var provider = new FakePaymentProvider(Config());
        Assert.True(provider.ParseWebhook("{\"reference\":\"R\",\"status\":\"success\"}").Success);
        Assert.False(provider.ParseWebhook("{\"reference\":\"R\",\"status\":\"failed\"}").Success);
    }
}
