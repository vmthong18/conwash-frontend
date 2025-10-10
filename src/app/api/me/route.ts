import { NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";

export async function GET() {
  const token = await getAccess();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const r = await fetch(`${process.env.DIRECTUS_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: "Failed" }, { status: 401 });

  const { data } = await r.json();
  return NextResponse.json({ ok: true, user: data });
}
