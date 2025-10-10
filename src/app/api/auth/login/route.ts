import { NextRequest, NextResponse } from "next/server";
import { setTokensOnResponse } from "@/lib/cookies";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const r = await fetch(`${process.env.DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: false, error: err?.errors?.[0]?.message || "Login failed" }, { status: 401 });
  }

  const { data } = await r.json(); // { access_token, refresh_token, expires }
  let accessMaxAge = 60 * 60 * 24;
  if (data?.expires) {
    const diff = Math.floor((new Date(data.expires).getTime() - Date.now()) / 1000);
    if (diff > 0) accessMaxAge = diff;
  }

  const res = NextResponse.json({ ok: true });
  setTokensOnResponse(res, { access_token: data.access_token, refresh_token: data.refresh_token, access_max_age: accessMaxAge });
  return res;
}
