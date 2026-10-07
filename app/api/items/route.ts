import { NextResponse } from "next/server";
import { gasGet } from "@/lib/gas";
import { mapItem, toRows } from "@/lib/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await gasGet();
    const items = toRows(raw).map(mapItem).filter((i) => i.id && i.name);
    return NextResponse.json({ items, raw: items.length ? undefined : JSON.stringify(raw).slice(0, 400) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
