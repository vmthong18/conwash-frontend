import { NextResponse } from "next/server";
import { getAccess, clearTokensOnResponse } from "@/lib/cookies";

export async function POST() {
  try {
    const token = await getAccess();
    if (token) {
      await fetch(`${process.env.DIRECTUS_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  } finally {
    const res = NextResponse.json({ ok: true });
    clearTokensOnResponse(res);
    return res;
  }
}
