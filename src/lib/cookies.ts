// src/lib/cookies.ts
import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const ACCESS  = process.env.COOKIE_ACCESS  ?? "be_giay_access";
export const REFRESH = process.env.COOKIE_REFRESH ?? "be_giay_refresh";
const isProd = process.env.NODE_ENV === "production";

const base = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };

// đọc TTL từ env nếu có, fallback về 1h & 7d
const ACCESS_DEFAULT = Number(process.env.ACCESS_TOKEN_TTL_SEC ?? 60 * 60);
const REFRESH_DEFAULT = Number(process.env.REFRESH_TOKEN_TTL_SEC ?? 60 * 60 * 24 * 7);

export type TokenPayload = {
  access_token: string;
  refresh_token: string;
  access_max_age?: number;   // default 1h
  refresh_max_age?: number;  // default 7d
};

export function setTokensOnResponse(
  res: NextResponse,
  {
    access_token,
    refresh_token,
    access_max_age = ACCESS_DEFAULT,
    refresh_max_age = REFRESH_DEFAULT
  }: TokenPayload
) {
  res.cookies.set({ name: ACCESS,  value: access_token,  ...base, maxAge: access_max_age });
  res.cookies.set({ name: REFRESH, value: refresh_token, ...base, maxAge: refresh_max_age });
}

export function clearTokensOnResponse(res: NextResponse) {
  res.cookies.set({ name: ACCESS,  value: "", ...base, maxAge: 0 });
  res.cookies.set({ name: REFRESH, value: "", ...base, maxAge: 0 });
}

// đổi thành hàm sync
export function getAccess() {
  const jar = cookies();
  return jar.get(ACCESS)?.value ?? null;
}
export function getRefresh() {
  const jar = cookies();
  return jar.get(REFRESH)?.value ?? null;
}
