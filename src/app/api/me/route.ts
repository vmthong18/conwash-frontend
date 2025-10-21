import { NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";
import { directusFetch } from "@/lib/directusFetch";

export async function GET() {
  const token = await getAccess();
  if (!token)  return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const r = await directusFetch(`${process.env.DIRECTUS_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok)  return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Failed" }, { status: 401 });

  const { data } = await r.json();
  return NextResponse.json({ ok: true, user: data });
}
