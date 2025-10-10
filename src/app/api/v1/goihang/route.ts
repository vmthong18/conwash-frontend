import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";


export async function GET(req: NextRequest) {
    const token = await getAccess();
    if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });



    const url = new URL(`${process.env.DIRECTUS_URL}/items/goihang`);

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!res.ok) {
        const err = await res.text().catch(() => "");
        return NextResponse.json({ ok: false, error: err || "Lookup failed" }, { status: 400 });
    }
    const data = await res.json();
    const gh = (data?.data || [])|| null;
    return NextResponse.json({ ok: true, found: !!gh, gh });
}
