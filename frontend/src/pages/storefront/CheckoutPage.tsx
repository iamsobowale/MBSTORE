import { useState } from "react";
import { useCart } from "../../features/cart/CartContext";
import { placeOrder, validateDiscount } from "../../features/checkout/api";
import { initiatePayment } from "../../features/checkout/paymentApi";
import { formatMoney } from "../../lib/format";

const FLAT_SHIPPING = 2500;
const FREE_SHIPPING_THRESHOLD = 100000;

export function CheckoutPage() {
  const { cart, clearLocal } = useCart();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    addressLine: "", state: "", city: "", deliveryInstructions: "",
  });
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ amount: number; error: string | null } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cart || cart.items.length === 0) {
    return <div className="container" style={{ padding: "var(--space-16) 0", textAlign: "center" }}>Your cart is empty.</div>;
  }

  const subtotal = cart.subtotal;
  const discountAmount = discount?.amount ?? 0;
  // Client-side preview only — the server recomputes authoritatively at checkout.
  const shipping = subtotal - discountAmount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total = subtotal - discountAmount + shipping;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const applyCode = async () => {
    if (!code.trim()) return;
    const res = await validateDiscount(code.trim(), subtotal);
    setDiscount({ amount: res.amount, error: res.error });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder({
        cartToken: cart.token,
        ...form,
        deliveryInstructions: form.deliveryInstructions || null,
        discountCode: discount && !discount.error ? code.trim() : null,
      });
      clearLocal();
      // Start payment and hand off to the gateway (Fake provider → local mock page).
      const payment = await initiatePayment(order.trackingToken);
      window.location.href = payment.authorizationUrl;
    } catch (err: unknown) {
      setError((err as { response?: { data?: { title?: string } } })?.response?.data?.title ?? "Checkout failed. Please review your cart and try again.");
      setPlacing(false);
    }
  };

  return (
    <form onSubmit={submit} className="container" style={{ padding: "var(--space-12) 0", display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(300px, 1fr)", gap: "var(--space-12)" }}>
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: 0 }}>Checkout</h1>
        <p style={{ color: "var(--color-muted)", marginTop: 0 }}>No account required — check out as a guest.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <Field label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} required />
          <Field label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
          <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} required />
        </div>
        <Field label="Delivery address" value={form.addressLine} onChange={(v) => set("addressLine", v)} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <Field label="State" value={form.state} onChange={(v) => set("state", v)} required />
          <Field label="City" value={form.city} onChange={(v) => set("city", v)} required />
        </div>
        <Field label="Delivery instructions (optional)" value={form.deliveryInstructions} onChange={(v) => set("deliveryInstructions", v)} />

        {error && <div style={{ color: "var(--color-danger)", marginTop: "var(--space-4)" }}>{error}</div>}
      </div>

      <aside style={{ alignSelf: "start", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-lg)", marginTop: 0 }}>Order summary</h2>
        {cart.items.map((i) => (
          <div key={i.productVariantId} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>
            <span>{i.productName} · {i.color}/{i.size} × {i.quantity}</span>
            <span>{formatMoney(i.lineTotal)}</span>
          </div>
        ))}
        <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "var(--space-4) 0" }} />

        <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <input placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1, padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }} />
          <button type="button" onClick={applyCode} style={ghostBtn}>Apply</button>
        </div>
        {discount?.error && <div style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>{discount.error}</div>}

        <Row label="Subtotal" value={formatMoney(subtotal)} />
        {discountAmount > 0 && <Row label="Discount" value={`- ${formatMoney(discountAmount)}`} />}
        <Row label="Shipping (est.)" value={shipping === 0 ? "Free" : formatMoney(shipping)} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "var(--text-lg)", marginTop: "var(--space-3)" }}>
          <span>Total</span><span>{formatMoney(total)}</span>
        </div>

        <button type="submit" disabled={placing} className="mb-btn" style={{ width: "100%", marginTop: "var(--space-4)" }}>
          {placing ? "Redirecting…" : "Continue to payment"}
        </button>
        <p style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)", marginTop: "var(--space-3)" }}>
          Totals are confirmed by the server. You'll complete payment on the next screen.
        </p>
      </aside>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label style={{ display: "block", marginTop: "var(--space-3)" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{label}</span>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", marginTop: "var(--space-1)" }} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
      <span style={{ color: "var(--color-muted)" }}>{label}</span><span>{value}</span>
    </div>
  );
}

const ghostBtn = { padding: "var(--space-2) var(--space-4)", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" } as const;
