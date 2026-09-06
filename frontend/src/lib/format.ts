const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Formats a decimal amount as store currency (NGN for MVP). */
export function formatMoney(amount: number): string {
  return currency.format(amount);
}
