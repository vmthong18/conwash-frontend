import { NextRequest, NextResponse } from "next/server";
import { setTokensOnResponse } from "@/lib/cookies";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const r = await fetch(`${process.env.DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!r.ok) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url, 302);
  }

  const { data } = await r.json();
  let accessMaxAge = Number(process.env.ACCESS_TOKEN_TTL_SEC ?? 60 * 60 * 24); // fallback 24h
  if (data?.expires) {
    const diff = Math.floor((new Date(data.expires).getTime() - Date.now()) / 1000);
    if (diff > 0) accessMaxAge = diff;
  }

  const res = NextResponse.json({ ok: true });
  setTokensOnResponse(res, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    access_max_age: accessMaxAge,
  });
  return res;
}
