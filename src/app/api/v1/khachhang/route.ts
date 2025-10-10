import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";

// GET /api/v1/khachhang?phone=...
export async function GET(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ ok: false, error: "Thiếu phone" }, { status: 400 });

  const url = new URL(`${process.env.DIRECTUS_URL}/items/khachhang`);
  url.searchParams.set("filter[DienThoai][_contains]", phone);  // Tìm kiếm theo số điện thoại chứa chuỗi nhập vào
  url.searchParams.set("limit", "10"); // Giới hạn 10 kết quả

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (!r.ok) {
    const err = await r.text().catch(() => "");
    return NextResponse.json({ ok: false, error: err || "Lookup failed" }, { status: 400 });
  }

  const data = await r.json();
  const kh = (data?.data || [])|| null;

  return NextResponse.json({
    ok: true,
    found: !!kh,
    kh,
    customers: data?.data?.map((item: any) => item.DienThoai) || []  // Trả về danh sách số điện thoại
  });
}


// POST /api/v1/khachhang  { Tenkhachhang, DiaChi, DienThoai }
export async function POST(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();
  const { Tenkhachhang, DiaChi, DienThoai } = body || {};
  if (!Tenkhachhang || !DienThoai) {
    return NextResponse.json({ ok: false, error: "Thiếu Tenkhachhang/DienThoai" }, { status: 400 });
    }

  // Nếu đã tồn tại theo SĐT thì trả luôn
  const check = await fetch(
    `${process.env.DIRECTUS_URL}/items/khachhang?filter[DienThoai][_eq]=${encodeURIComponent(DienThoai)}&limit=1`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  ).then(r => r.json()).catch(()=>({}));

  const existed = check?.data?.[0];
  if (existed) return NextResponse.json({ ok: true, created: false, kh: existed });

  // Tạo KH mới
  const r = await fetch(`${process.env.DIRECTUS_URL}/items/khachhang`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ Tenkhachhang, DiaChi, DienThoai }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    return NextResponse.json({ ok: false, error: err || "Create customer failed" }, { status: 400 });
  }
  const data = await r.json();
  return NextResponse.json({ ok: true, created: true, kh: data?.data });
}
