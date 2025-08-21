import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const ACCESS  = process.env.COOKIE_ACCESS  ?? "be_giay_access";
export const REFRESH = process.env.COOKIE_REFRESH ?? "be_giay_refresh";
const isProd = process.env.NODE_ENV === "production";

const base = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };

export type TokenPayload = {
  access_token: string;
  refresh_token: string;
  access_max_age?: number;   // default 1h
  refresh_max_age?: number;  // default 7d
};

export function setTokensOnResponse(
  res: NextResponse,
  { access_token, refresh_token, access_max_age = 60 * 60, refresh_max_age = 60 * 60 * 24 * 7 }: TokenPayload
) {
  res.cookies.set({ name: ACCESS,  value: access_token,  ...base, maxAge: access_max_age });
  res.cookies.set({ name: REFRESH, value: refresh_token, ...base, maxAge: refresh_max_age });
}

export function clearTokensOnResponse(res: NextResponse) {
  res.cookies.set({ name: ACCESS,  value: "", ...base, maxAge: 0 });
  res.cookies.set({ name: REFRESH, value: "", ...base, maxAge: 0 });
}

export async function getAccess() {
  const jar = await cookies();
  return jar.get(ACCESS)?.value ?? null;
}

export async function getRefresh() {
  const jar = await cookies();
  return jar.get(REFRESH)?.value ?? null;
}
