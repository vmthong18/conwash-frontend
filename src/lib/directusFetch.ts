import { getAccess, getRefresh } from "@/lib/cookies";
// import { NextResponse } from "next/server"; // không dùng ở đây

const DIRECTUS_URL =
  process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL!;
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
  return (json?.data as {
    access_token: string;
    refresh_token?: string;
    expires?: string;
  }) || null;
}

/**
 * Gọi Directus trên server:
 *  - Tự gắn Bearer từ cookie
 *  - 401 TOKEN_EXPIRED -> refresh -> retry 1 lần
 *  - Giữ nguyên Response để caller .json() / .text()
 */
export async function directusFetch(
  inputPath: string,
  init: RequestInit = {}
): Promise<Response> {
  // Token từ cookie (server)
  let at = getAccess();
  const rt = getRefresh();

  // Xác định URL: chấp nhận path hoặc URL đầy đủ
  const url = inputPath.includes(DIRECTUS_URL)
    ? inputPath
    : `${DIRECTUS_URL}${inputPath}`;

  // Header & Content-Type linh hoạt theo body
  const headers = new Headers(init.headers || {});
  const body: any = init.body;

  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob =
    typeof Blob !== "undefined" && body instanceof Blob;
  const isArrayBuffer =
    typeof ArrayBuffer !== "undefined" &&
    (body instanceof ArrayBuffer ||
      // @ts-ignore
      (ArrayBuffer.isView && ArrayBuffer.isView(body)));

  // Chỉ set JSON khi KHÔNG phải multipart/binary
  if (!headers.has("Content-Type") && !isForm && !isBlob && !isArrayBuffer) {
    headers.set("Content-Type", "application/json");
  }
  if (at) headers.set("Authorization", `Bearer ${at}`);

  const go = () =>
    fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });

  // Lần 1
  let res = await go();
  if (res.status !== 401) return res;

  // 401: kiểm tra có cần refresh
  let needRefresh = false;
  try {
    const b = await res.clone().json();
    const code = b?.errors?.[0]?.extensions?.code;
    needRefresh = code === "TOKEN_EXPIRED" || code === "INVALID_CREDENTIALS";
  } catch {
    needRefresh = true;
  }

  if (!needRefresh || !rt) return res;

  // Refresh
  const newPair = await refreshByRefreshToken(rt);
  if (!newPair?.access_token) return res;

  // Retry với token mới
  at = newPair.access_token;
  headers.set("Authorization", `Bearer ${at}`);
  res = await go();

  return res;
}
