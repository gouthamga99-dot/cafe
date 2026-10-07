"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Item, OrderRow } from "@/lib/types";
import { groupOrders, isPaid, money } from "@/lib/format";

type Props = { active: boolean; toast: (msg: string, err?: boolean) => void };
type Filter = "all" | "pending" | "paid";

const REFRESH_MS = 15000;

export default function AdminView({ active, toast }: Props) {
  const [pin, setPin] = useState("");
  const [input, setInput] = useState("");
  const [locked, setLocked] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string[]>([]);
  const [updated, setUpdated] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try { const p = sessionStorage.getItem("cafe-admin-pin"); if (p) setPin(p); } catch {}
  }, []);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const r = await fetch("/api/orders", { cache: "no-store", headers: { "x-admin-pin": pin } });
      if (r.status === 401) {
        setLocked(true);
        if (pin) { toast("Wrong PIN", true); try { sessionStorage.removeItem("cafe-admin-pin"); } catch {} }
        return;
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load orders");
      setLocked(false);
      setOrders(d.orders);
      setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (pin) { try { sessionStorage.setItem("cafe-admin-pin", pin); } catch {} }
    } catch (e: any) {
      if (!silent) toast(e.message || "Could not load orders.", true);
    } finally {
      setRefreshing(false);
    }
  }, [pin, toast]);

  const loadItems = useCallback(async () => {
    try {
      const r = await fetch("/api/items", { cache: "no-store" });
      const d = await r.json();
      if (r.ok) setItems(d.items);
    } catch {}
  }, []);

  useEffect(() => {
    if (!active) return;
    loadOrders();
    loadItems();
    const t = setInterval(() => loadOrders(true), REFRESH_MS);
    return () => clearInterval(t);
  }, [active, loadOrders, loadItems]);

  async function setPayment(orderId: string, to: "Paid" | "Pending") {
    setBusy((b) => [...b, orderId]);
    try {
      const r = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pin": pin },
        body: JSON.stringify({ orderId, paymentStatus: to }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not update payment.");
      setOrders((os) => os.map((o) => (o.orderId === orderId ? { ...o, pay: to } : o)));
      toast(`${orderId} marked ${to.toLowerCase()}`);
    } catch (e: any) {
      toast(e.message, true);
    }
    setBusy((b) => b.filter((x) => x !== orderId));
  }

  const all = useMemo(() => groupOrders(orders), [orders]);
  const paid = all.filter((o) => isPaid(o.pay));
  const pend = all.filter((o) => !isPaid(o.pay));
  const query = q.trim().toLowerCase();
  const list = all.filter(
    (o) =>
      (filter === "all" || (filter === "paid") === isPaid(o.pay)) &&
      (!query || o.id.toLowerCase().includes(query) || o.lines.some((l) => l.item.toLowerCase().includes(query)))
  );

  return (
    <main className={`wrap ${active ? "" : "hidden"}`}>
      {locked ? (
        <div className="gate">
          <h2 style={{ fontFamily: "var(--display)" }}>Admin access</h2>
          <p className="lead" style={{ margin: "6px auto 0" }}>Enter the admin PIN to manage orders.</p>
          <input
            type="password" inputMode="numeric" placeholder="••••" autoComplete="off" aria-label="Admin PIN"
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setPin(input)}
          />
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setPin(input)}>Open admin</button>
        </div>
      ) : (
        <>
          <section className="hero" style={{ paddingBottom: 20 }}>
            <h1>Orders</h1>
            <p className="lead">Track what customers ordered and mark payments as they come in.</p>
          </section>

          <div className="stats">
            <div className="stat hl"><span>Collected</span><b>{money(paid.reduce((s, o) => s + o.total, 0))}</b></div>
            <div className="stat"><span>Waiting for payment</span><b>{money(pend.reduce((s, o) => s + o.total, 0))}</b></div>
            <div className="stat"><span>Total orders</span><b>{all.length}</b></div>
            <div className="stat"><span>Unpaid orders</span><b>{pend.length}</b></div>
          </div>

          <div className="tools">
            <div className="filters">
              {(["all", "pending", "paid"] as Filter[]).map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "pending" ? "Payment pending" : "Paid"}
                </button>
              ))}
            </div>
            <input className="search" type="search" placeholder="Search order ID or item" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="live">{updated ? `Updated ${updated}` : "Live"}</div>
            <button className="btn btn-ghost" onClick={() => { loadOrders(); loadItems(); }}>
              {refreshing ? <span className="spin" /> : "Refresh"}
            </button>
          </div>

          <div className="panel"><div className="scroll">
            <table>
              <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {list.length ? list.map((o) => {
                  const p = isPaid(o.pay);
                  const isBusy = busy.includes(o.id);
                  return (
                    <tr key={o.id}>
                      <td><div className="oid">{o.id}</div><div className="date">{o.date}</div></td>
                      <td className="its">{o.lines.map((l, i) => <div key={i} style={{ textTransform: "capitalize" }}>{l.item} <span>× {l.qty}</span></div>)}</td>
                      <td><b>{money(o.total)}</b></td>
                      <td><span className={`pill ${p ? "paid" : "pending"}`}>{p ? "Paid" : "Pending"}</span></td>
                      <td><span className="pill plain">{o.status}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button className={`act ${p ? "" : "pay"}`} disabled={isBusy} onClick={() => setPayment(o.id, p ? "Pending" : "Paid")}>
                          {isBusy ? <span className="spin" /> : p ? "Mark unpaid" : "Mark as paid"}
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: 44 }}>
                    {all.length ? "No orders match this filter." : "No orders yet. They appear here as customers place them."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div></div>

          <h2 className="sec">Stock</h2>
          <div className="stock-grid">
            {items.map((it) => (
              <div className="sg" key={it.id}><b>{it.name}</b><div><span>{it.id}</span><span>{it.stock} left</span></div></div>
            ))}
          </div>
          <div style={{ height: 70 }} />
        </>
      )}
    </main>
  );
}
