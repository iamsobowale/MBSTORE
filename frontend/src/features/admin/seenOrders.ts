const KEY = "mb_seen_orders";

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]")); }
  catch { return new Set(); }
}

export function markOrderSeen(id: string) {
  const seen = getSeenIds();
  seen.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...seen])); } catch {}
}

export function countUnseen(orderIds: string[]): number {
  const seen = getSeenIds();
  return orderIds.filter((id) => !seen.has(id)).length;
}
