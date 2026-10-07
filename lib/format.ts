import type { GroupedOrder, OrderRow } from "./types";

export const CURRENCY = "₹";

export const money = (n: number) =>
  CURRENCY + (Math.round(n * 100) / 100).toLocaleString("en-IN");

export const isPaid = (s: string) => /^paid$/i.test(s);

export function emojiFor(name: string) {
  const n = name.toLowerCase();
  if (/cappu/.test(n)) return "☕";
  if (/latte/.test(n)) return "🥛";
  if (/tea|chai/.test(n)) return "🍵";
  if (/cold|iced|frapp|shake/.test(n)) return "🧋";
  if (/cake|pastry|brown/.test(n)) return "🍰";
  if (/sand|burger|toast/.test(n)) return "🥪";
  if (/cookie|biscuit/.test(n)) return "🍪";
  return "☕";
}

export function groupOrders(rows: OrderRow[]): GroupedOrder[] {
  const map = new Map<string, GroupedOrder>();
  rows.forEach((r) => {
    if (!r.orderId) return;
    if (!map.has(r.orderId)) map.set(r.orderId, { id: r.orderId, lines: [], total: 0, pay: r.pay, status: r.status, date: r.date });
    const g = map.get(r.orderId)!;
    g.lines.push(r);
    g.total += r.total || r.qty * r.price;
    if (isPaid(r.pay)) g.pay = r.pay;
  });
  return [...map.values()].reverse();
}
