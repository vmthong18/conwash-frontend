import { NextResponse } from "next/server";
import { getRefresh, setTokensOnResponse } from "@/lib/cookies";

export async function POST() {
  const refresh_token = await getRefresh();
  if (!refresh_token) return NextResponse.json({ ok: false, error: "No refresh token" }, { status: 401 });

  const r = await fetch(`${process.env.DIRECTUS_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: false, error: err?.errors?.[0]?.message || "Refresh failed" }, { status: 401 });
  }

  const { data } = await r.json();
  let accessMaxAge = 60 * 60;
  if (data?.expires) {
    const diff = Math.floor((new Date(data.expires).getTime() - Date.now()) / 1000);
    if (diff > 0) accessMaxAge = diff;
  }

  const res = NextResponse.json({ ok: true });
  setTokensOnResponse(res, { access_token: data.access_token, refresh_token: data.refresh_token, access_max_age: accessMaxAge });
  return res;
}
