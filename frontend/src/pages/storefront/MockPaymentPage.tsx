import { useSearchParams } from "react-router-dom";
import { formatMoney } from "../../lib/format";

/**
 * Local mock gateway page used only by the Fake payment provider (dev). Mimics a
 * hosted checkout so the initialize → redirect → verify flow can be exercised
 * end-to-end without real API keys. Real providers replace this with their own page.
 */
export function MockPaymentPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? "";
  const amount = Number(params.get("amount") ?? "0");
  const callback = params.get("callback") ?? "/payment/callback";

  const finish = (success: boolean) => {
    const url = new URL(callback);
    url.searchParams.set("reference", reference);
    if (!success) url.searchParams.set("status", "failed");
    window.location.href = url.toString();
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--color-surface)" }}>
      <div style={{ width: 380, background: "var(--color-bg)", borderRadius: "var(--radius-md)", padding: "var(--space-8)", boxShadow: "var(--shadow-md)", textAlign: "center" }}>
        <p className="eyebrow">Mock gateway (dev)</p>
        <h1 style={{ fontSize: "var(--text-2xl)", margin: "var(--space-4) 0" }}>{formatMoney(amount)}</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
          Simulate the outcome of a payment. This screen stands in for Paystack in local dev.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
          <button className="mb-btn" onClick={() => finish(true)}>Simulate successful payment</button>
          <button className="mb-btn mb-btn--ghost" onClick={() => finish(false)}>Simulate failed payment</button>
        </div>
      </div>
    </div>
  );
}
