import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createAdminDiscount,
  DISCOUNT_TYPE_LABEL,
  listAdminDiscounts,
  toggleDiscount,
  updateAdminDiscount,
  type AdminDiscountDetail,
  type UpsertDiscountRequest,
} from "../../features/admin/discountsApi";
import { formatMoney } from "../../lib/format";

const EMPTY_FORM: UpsertDiscountRequest = {
  code: "",
  type: "Percentage",
  value: 10,
  minOrderAmount: null,
  maxUsage: null,
  startsAt: null,
  expiresAt: null,
  isActive: true,
};

export function DiscountsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminDiscountDetail | null | "new">(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-discounts", { search, page }],
    queryFn: () => listAdminDiscounts({ search: search || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-discounts"] });

  const save = useMutation({
    mutationFn: (req: UpsertDiscountRequest) =>
      editing && editing !== "new"
        ? updateAdminDiscount(editing.id, req)
        : createAdminDiscount(req),
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleDiscount(id, active),
    onSuccess: invalidate,
  });

  if (editing !== null) {
    return (
      <DiscountForm
        initial={editing === "new" ? EMPTY_FORM : editing}
        onSave={(req) => save.mutate(req)}
        onCancel={() => setEditing(null)}
        isPending={save.isPending}
        error={save.error as Error | null}
      />
    );
  }

  return (
    <div>
      <div className="mb-section-head" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>Promotions</p>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Discounts</h1>
        </div>
        <button onClick={() => setEditing("new")} className="mb-btn" style={{ padding: "var(--space-2) var(--space-6)" }}>+ New discount</button>
      </div>

      <input
        className="mb-input"
        placeholder="Search codes…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: "var(--space-6)", width: 320 }}
      />

      {isLoading ? <p style={{ color: "var(--color-muted)" }}>Loading…</p> : data?.items.length === 0 ? <p style={{ color: "var(--color-muted)" }}>No discounts found.</p> : (
        <div className="mb-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="mb-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700, letterSpacing: "0.05em" }}>{d.code}</td>
                  <td>{DISCOUNT_TYPE_LABEL[d.type] ?? d.type}</td>
                  <td>{d.type === "Percentage" ? `${d.value}%` : formatMoney(d.value)}</td>
                  <td>{d.usageCount}{d.maxUsage ? ` / ${d.maxUsage}` : ""}</td>
                  <td style={{ color: "var(--color-muted)" }}>
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <span style={{ color: d.isActive ? "var(--color-success)" : "var(--color-danger)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                      {d.isActive ? "● Active" : "○ Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => setEditing(d)} style={linkBtn}>Edit</button>
                    <button
                      onClick={() => toggle.mutate({ id: d.id, active: !d.isActive })}
                      style={{ ...linkBtn, color: d.isActive ? "var(--color-danger)" : "var(--color-success)" }}
                    >
                      {d.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)", alignItems: "center" }}>
          <button className="mb-btn mb-btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="eyebrow">Page {data.page} / {data.totalPages}</span>
          <button className="mb-btn mb-btn--ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function DiscountForm({ initial, onSave, onCancel, isPending, error }: {
  initial: UpsertDiscountRequest;
  onSave: (req: UpsertDiscountRequest) => void;
  onCancel: () => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [form, setForm] = useState<UpsertDiscountRequest>(initial);
  const set = <K extends keyof UpsertDiscountRequest>(k: K, v: UpsertDiscountRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ maxWidth: 540 }}>
      <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)" }}>
        {form.code ? `Edit ${form.code}` : "New discount"}
      </h1>

      <div style={fieldGroup}>
        <label style={label}>Code</label>
        <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} style={input} placeholder="e.g. SUMMER20" required />
      </div>
      <div style={fieldGroup}>
        <label style={label}>Type</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)} style={input}>
          <option value="Percentage">Percentage (%)</option>
          <option value="FixedAmount">Fixed amount (₦)</option>
        </select>
      </div>
      <div style={fieldGroup}>
        <label style={label}>{form.type === "Percentage" ? "Percentage (%)" : "Amount (₦)"}</label>
        <input type="number" value={form.value} min={0} onChange={(e) => set("value", Number(e.target.value))} style={input} />
      </div>
      <div style={fieldGroup}>
        <label style={label}>Min order amount (₦, optional)</label>
        <input type="number" value={form.minOrderAmount ?? ""} min={0} onChange={(e) => set("minOrderAmount", e.target.value === "" ? null : Number(e.target.value))} style={input} />
      </div>
      <div style={fieldGroup}>
        <label style={label}>Max uses (optional)</label>
        <input type="number" value={form.maxUsage ?? ""} min={1} onChange={(e) => set("maxUsage", e.target.value === "" ? null : Number(e.target.value))} style={input} />
      </div>
      <div style={fieldGroup}>
        <label style={label}>Starts at (optional)</label>
        <input type="date" value={form.startsAt?.slice(0, 10) ?? ""} onChange={(e) => set("startsAt", e.target.value || null)} style={input} />
      </div>
      <div style={fieldGroup}>
        <label style={label}>Expires at (optional)</label>
        <input type="date" value={form.expiresAt?.slice(0, 10) ?? ""} onChange={(e) => set("expiresAt", e.target.value || null)} style={input} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <input type="checkbox" id="active" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        <label htmlFor="active">Active</label>
      </div>

      {error && <p style={{ color: "var(--color-danger)", marginBottom: "var(--space-4)" }}>{(error as { response?: { data?: { detail?: string; title?: string } } }).response?.data?.detail ?? error.message}</p>}

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button onClick={() => onSave(form)} disabled={isPending} className="mb-btn">{isPending ? "Saving…" : "Save"}</button>
        <button onClick={onCancel} className="mb-btn mb-btn--ghost">Cancel</button>
      </div>
    </div>
  );
}

const linkBtn = { marginLeft: "var(--space-3)", fontSize: "var(--text-sm)", background: "none", border: "none", cursor: "pointer" } as const;
const fieldGroup = { marginBottom: "var(--space-4)" } as const;
const label = { display: "block", marginBottom: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-muted)" } as const;
const input = { width: "100%", padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontFamily: "inherit" } as const;
