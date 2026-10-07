"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Item } from "@/lib/types";
import { emojiFor, money } from "@/lib/format";

type Props = { active: boolean; toast: (msg: string, err?: boolean) => void };

function Tile({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  if (item.img && /^https?:/i.test(item.img) && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.img} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <>{emojiFor(item.name)}</>;
}

export default function UserView({ active, toast }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [raw, setRaw] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const r = await fetch("/api/items", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not load the menu");
      const list: Item[] = d.items;
      setItems(list);
      setRaw(d.raw || "");
      setErr("");
      setCart((prev) =>
        Object.fromEntries(
          Object.entries(prev)
            .map(([id, q]) => [id, Math.min(q, list.find((i) => i.id === id)?.stock ?? 0)] as [string, number])
            .filter(([, q]) => q > 0)
        )
      );
    } catch (e: any) {
      setErr(e.message || "Could not load the menu");
      if (!silent) toast("Could not load the menu. Check your connection and refresh.", true);
    }
    setLoaded(true);
  }, [toast]);

  useEffect(() => { if (active) load(); }, [active, load]);

  const lines = useMemo(
    () => Object.entries(cart).map(([id, q]) => ({ it: items.find((i) => i.id === id), q })).filter((l): l is { it: Item; q: number } => !!l.it && l.q > 0),
    [cart, items]
  );
  const total = lines.reduce((s, l) => s + l.q * l.it.price, 0);
  const count = lines.reduce((s, l) => s + l.q, 0);

  const change = (it: Item, delta: number) =>
    setCart((c) => {
      const q = Math.min(Math.max((c[it.id] || 0) + delta, 0), it.stock);
      const next = { ...c };
      if (q <= 0) delete next[it.id]; else next[it.id] = q;
      return next;
    });

  async function placeOrder() {
    if (!lines.length || placing) return;
    setPlacing(true);
    try {
      const r = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map((l) => ({ productId: l.it.id, quantity: l.q })) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not place the order. Try again.");
      setDone(d.orderId || "Order received");
      setCart({});
      toast("Order placed");
      await load(true);
    } catch (e: any) {
      toast(e.message, true);
    }
    setPlacing(false);
  }

  return (
    <main className={`wrap ${active ? "" : "hidden"}`}>
      <section className="hero">
        <h1>What are you having today?</h1>
        <p className="lead">Pick your drinks, check your receipt, and place the order. The counter sees it right away.</p>
      </section>

      <div className="shop">
        <div className="menu" aria-live="polite">
          {!loaded && <><div className="skel" /><div className="skel" /><div className="skel" /></>}

          {loaded && !items.length && (
            <div className="row diag">
              {err ? (
                <>Could not reach the script: {err}</>
              ) : (
                <>The script answered, but no menu rows were found.<br /><small>Response: {raw}</small></>
              )}
              <br /><br />
              <button className="btn btn-ghost" onClick={() => load()}>Try again</button>
            </div>
          )}

          {items.map((it) => {
            const q = cart[it.id] || 0;
            const out = it.stock <= 0;
            return (
              <div key={it.id} className={`row ${out ? "out" : ""}`}>
                <div className="tile"><Tile item={it} /></div>
                <div>
                  <h3>{it.name}</h3>
                  <div className="meta">
                    <span className="price">{money(it.price)}</span>
                    {out ? <span className="chip zero">Sold out</span>
                      : it.stock <= 5 ? <span className="chip low">Only {it.stock} left</span>
                      : <span className="chip">{it.stock} in stock</span>}
                  </div>
                </div>
                <div className="ctrl">
                  {out ? <button className="add" disabled>Unavailable</button>
                    : q === 0 ? <button className="add" onClick={() => change(it, 1)}>Add</button>
                    : (
                      <div className="stepper">
                        <button onClick={() => change(it, -1)} aria-label={`Remove one ${it.name}`}>−</button>
                        <b>{q}</b>
                        <button onClick={() => change(it, 1)} disabled={q >= it.stock} aria-label={`Add one ${it.name}`}>+</button>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="receipt" id="receipt" aria-label="Your order">
          {done ? (
            <div className="done">
              <div className="tick">✓</div>
              <h2>Order placed</h2>
              <p className="sub">Show this number at the counter.</p>
              <code>{done}</code>
              <button className="btn btn-primary" onClick={() => setDone(null)}>Start a new order</button>
            </div>
          ) : (
            <>
              <h2>Your order</h2>
              <p className="sub">{count ? `${count} ${count > 1 ? "items" : "item"}` : "Nothing added yet"}</p>
              <div className="lines">
                {lines.length ? lines.map((l) => (
                  <div className="line" key={l.it.id}>
                    <span style={{ textTransform: "capitalize" }}>{l.it.name}</span>
                    <span className="rm">{money(l.q * l.it.price)}</span>
                    <small>{l.q} × {money(l.it.price)}</small>
                  </div>
                )) : <div className="empty">Add something from the menu<br />and it shows up here.</div>}
              </div>
              <div className="total"><span>Total</span><b>{money(total)}</b></div>
              <button className="btn btn-primary" onClick={placeOrder} disabled={!lines.length || placing}>
                {placing ? <><span className="spin" /> Placing order</> : "Place order"}
              </button>
            </>
          )}
        </aside>
      </div>

      {active && count > 0 && !done && (
        <button className="cartfab" onClick={() => document.getElementById("receipt")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          🧾 <span>{count} · {money(total)}</span>
        </button>
      )}
    </main>
  );
}
