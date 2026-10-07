import { NextResponse } from "next/server";
import { gasPost, scriptFailed } from "@/lib/gas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    const clean = items
      .map((i: any) => ({ productId: String(i.productId || ""), quantity: Math.floor(Number(i.quantity)) }))
      .filter((i: any) => i.productId && i.quantity > 0);
    if (!clean.length) return NextResponse.json({ error: "Your order is empty" }, { status: 400 });

    const res = await gasPost({ action: "createOrder", items: clean });
    const failed = scriptFailed(res);
    if (failed) return NextResponse.json({ error: failed }, { status: 400 });

    const orderId = res?.orderId || res?.order?.orderId || res?.id || "";
    return NextResponse.json({ orderId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
