import { NextResponse } from "next/server";
import { gasGet } from "@/lib/gas";
import { isAdmin } from "@/lib/auth";
import { mapOrder, toRows } from "@/lib/parse";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  try {
    const raw = await gasGet("?action=orders");
    return NextResponse.json({ orders: toRows(raw).map(mapOrder).filter((o) => o.orderId) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
