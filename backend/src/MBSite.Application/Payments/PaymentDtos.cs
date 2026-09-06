namespace MBSite.Application.Payments;

public record InitiatePaymentRequest(string TrackingToken);
public record PaymentInitResponse(string AuthorizationUrl, string Reference);

public record VerifyPaymentRequest(string Reference);

public record PaymentResultDto(
    bool Success,
    string OrderStatus,
    string TrackingToken,
    string PublicReference,
    string? Message);
