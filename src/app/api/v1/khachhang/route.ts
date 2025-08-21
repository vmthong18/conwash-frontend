import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";

// GET /api/v1/khachhang?phone=...
export async function GET(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ ok: false, error: "Thiếu phone" }, { status: 400 });

  const url = new URL(`${process.env.DIRECTUS_URL}/items/KhachHang`);
  url.searchParams.set("filter[DienThoai][_eq]", phone);
  url.searchParams.set("limit", "1");

  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    return NextResponse.json({ ok: false, error: err || "Lookup failed" }, { status: 400 });
  }
  const data = await r.json();
  const kh = (data?.data || [])[0] || null;
  return NextResponse.json({ ok: true, found: !!kh, kh });
}

// POST /api/v1/khachhang  { TenKhachHang, DiaChi, DienThoai }
export async function POST(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();
  const { TenKhachHang, DiaChi, DienThoai } = body || {};
  if (!TenKhachHang || !DienThoai) {
    return NextResponse.json({ ok: false, error: "Thiếu TenKhachHang/DienThoai" }, { status: 400 });
    }

  // Nếu đã tồn tại theo SĐT thì trả luôn
  const check = await fetch(
    `${process.env.DIRECTUS_URL}/items/KhachHang?filter[DienThoai][_eq]=${encodeURIComponent(DienThoai)}&limit=1`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  ).then(r => r.json()).catch(()=>({}));

  const existed = check?.data?.[0];
  if (existed) return NextResponse.json({ ok: true, created: false, kh: existed });

  // Tạo KH mới
  const r = await fetch(`${process.env.DIRECTUS_URL}/items/KhachHang`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ TenKhachHang, DiaChi, DienThoai }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    return NextResponse.json({ ok: false, error: err || "Create customer failed" }, { status: 400 });
  }
  const data = await r.json();
  return NextResponse.json({ ok: true, created: true, kh: data?.data });
}
