import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../../features/checkout/paymentApi";

type State = "verifying" | "success" | "failed";

/**
 * Landing page after the payment gateway redirects back. Verifies the transaction
 * server-side (idempotent) and routes to the order on success. The webhook remains
 * the authoritative confirmation, so a failed redirect never loses a real payment.
 */
export function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference");
  const failedFlag = params.get("status") === "failed";
  const [state, setState] = useState<State>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (failedFlag || !reference) {
      setState("failed");
      return;
    }
    verifyPayment(reference)
      .then((res) => {
        if (res.success) {
          navigate(`/order/${res.trackingToken}`, { replace: true });
        } else {
          setState("failed");
        }
      })
      .catch(() => setState("failed"));
  }, [reference, failedFlag, navigate]);

  return (
    <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center", maxWidth: 520 }}>
      {state === "verifying" && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Confirming your payment…</h1>
          <p style={{ color: "var(--color-muted)" }}>This only takes a moment. Please don't close this window.</p>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Payment not completed</h1>
          <p style={{ color: "var(--color-muted)" }}>
            Your payment wasn't confirmed. If money was debited, it will be reconciled automatically —
            your order is safe.
          </p>
          <Link to="/cart" className="mb-btn" style={{ marginTop: "var(--space-6)" }}>Back to cart</Link>
        </>
      )}
    </div>
  );
}
