import type { Item, OrderRow } from "./types";

const norm = (k: string) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");

function pick(o: Record<string, unknown>, ...names: string[]): unknown {
  const m: Record<string, unknown> = {};
  for (const k in o) m[norm(k)] = o[k];
  for (const n of names) {
    const v = m[norm(n)];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

const num = (v: unknown) => {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
};

function findArray(d: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(d)) return d;
  if (!d || typeof d !== "object" || depth > 4) return null;
  const obj = d as Record<string, unknown>;
  for (const k of ["items", "orders", "data", "rows", "result", "products", "values"]) {
    if (obj[k] !== undefined) {
      const a = findArray(obj[k], depth + 1);
      if (a) return a;
    }
  }
  for (const v of Object.values(obj)) {
    const a = findArray(v, depth + 1);
    if (a) return a;
  }
  const vals = Object.values(obj);
  if (vals.length && vals.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
    const keys = Object.keys(obj);
    return vals.map((v, i) => ({ id: keys[i], ...(v as object) }));
  }
  return null;
}

export function toRows(data: unknown): Record<string, unknown>[] {
  const arr = findArray(data) || [];
  if (arr.length && Array.isArray(arr[0])) {
    const head = arr[0] as string[];
    return (arr.slice(1) as unknown[][]).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
  }
  return arr as Record<string, unknown>[];
}

export const mapItem = (o: Record<string, unknown>): Item => ({
  id: String(pick(o, "id", "productId", "Product ID")),
  name: String(pick(o, "item", "name")),
  stock: num(pick(o, "stock")),
  price: num(pick(o, "price")),
  img: String(pick(o, "img", "image")),
});

export const mapOrder = (o: Record<string, unknown>): OrderRow => ({
  orderId: String(pick(o, "orderId", "Order ID")),
  productId: String(pick(o, "productId", "Product ID")),
  item: String(pick(o, "item", "name")),
  qty: num(pick(o, "quantity", "qty")),
  price: num(pick(o, "price")),
  total: num(pick(o, "total")),
  pay: String(pick(o, "paymentStatus", "Payment Status") || "Pending"),
  status: String(pick(o, "orderStatus", "Order Status") || "Pending"),
  date: String(pick(o, "date")),
});
