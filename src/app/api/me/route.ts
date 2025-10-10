import { NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";
import router from "next/router";

export async function GET() {
  const token = await getAccess();
  if (!token)   router.push('/login');//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const r = await fetch(`${process.env.DIRECTUS_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok)   router.push('/login');//return NextResponse.json({ ok: false, error: "Failed" }, { status: 401 });

  const { data } = await r.json();
  return NextResponse.json({ ok: true, user: data });
}
