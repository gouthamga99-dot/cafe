import { NextResponse } from "next/server";
import { gasPost, scriptFailed } from "@/lib/gas";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  try {
    const { orderId, paymentStatus } = await req.json();
    if (!orderId || !["Paid", "Pending"].includes(paymentStatus))
      return NextResponse.json({ error: "Invalid payment update" }, { status: 400 });

    const res = await gasPost({ action: "updatePayment", orderId, paymentStatus });
    const failed = scriptFailed(res);
    if (failed) return NextResponse.json({ error: failed }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
