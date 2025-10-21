import { getAccess, getRefresh } from "@/lib/cookies";
import { NextResponse } from "next/server";

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
if (!DIRECTUS_URL) throw new Error("Missing DIRECTUS_URL");

async function refreshByRefreshToken(refresh_token: string) {
  const r = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  const json = await r.json().catch(() => null);
  return json?.data as { access_token: string; refresh_token?: string; expires?: string } | null;
}

/**
 * Dùng trong API route (server): tự gắn Bearer, tự refresh khi 401 TOKEN_EXPIRED, rồi retry 1 lần.
 * Trả về Response thật để anh tự .json() hoặc .text() theo nhu cầu.
 */
export async function directusFetch(inputPath: string, init: RequestInit = {}) {
  // lấy token từ cookie (server)
  let at = getAccess();
  const rt = getRefresh();

  const headers = new Headers(init.headers || {});
  if (at) headers.set("Authorization", `Bearer ${at}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const go = () => fetch(`${DIRECTUS_URL}${inputPath}`, { ...init, headers, cache: "no-store" });

  // lần 1
  let res = await go();
  if (res.status !== 401) return res;

  // kiểm tra có cần refresh không
  let needRefresh = false;
  try {
    const body = await res.clone().json();
    const code = body?.errors?.[0]?.extensions?.code;
    needRefresh = code === "TOKEN_EXPIRED" || code === "INVALID_CREDENTIALS";
  } catch {
    needRefresh = true;
  }

  if (!needRefresh || !rt) return res; // trả 401 cho caller tự xử lý logout

  // refresh
  const newPair = await refreshByRefreshToken(rt);
  if (!newPair?.access_token) return res;

  // cập nhật header Authorization và retry
  at = newPair.access_token;
  headers.set("Authorization", `Bearer ${at}`);
  res = await go();

  return res;
}
