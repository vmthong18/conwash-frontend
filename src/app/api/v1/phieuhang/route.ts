import { NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";
import { directusFetch } from "@/lib/directusFetch";

// GET ?kh=<id> -> trả về list DonHang trạng thái GHEP_DON của khách
export async function GET(req: Request) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kh = searchParams.get("kh");

  const url = new URL(`${process.env.DIRECTUS_URL}/items/donhang`);
  url.searchParams.set(
    "fields",
    [
      "ID",
      "TrangThai",
      "GhiChu",
      "GoiHangs",
      "ID_KhachHang.ID",
      "ID_KhachHang.TenKhachHang",
      "ID_KhachHang.DienThoai",
      "ID_KhachHang.DiaChi",
    ].join(",")
  );
  url.searchParams.set("filter[TrangThai][_eq]", "GHEP_DON");
  if (kh) url.searchParams.set("filter[ID_KhachHang][_eq]", kh);
  url.searchParams.set("limit", "-1");
  url.searchParams.set("sort", "ID");

  const r = await directusFetch(url.pathname + '?' + url.searchParams.toString());
  const data = await r.json();
  if (!r.ok)
    return NextResponse.json(
      { ok: false, error: data?.errors?.[0]?.message || "Fetch DonHang failed" },
      { status: r.status }
    );

  return NextResponse.json({ ok: true, data: data.data });
}

// POST -> tạo PhieuHang
export async function POST(req: Request) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  // ❗ ĐỌC JSON RỒI STRINGIFY – KHÔNG pass thẳng req.body (tránh lỗi duplex)
  const body = await req.json().catch(() => ({}));
  // ví dụ yêu cầu có { id, ...payload }
  const { ID_KhachHang, Donhangs, TongTien, TrangThai, ID_DiaDiem, ThanhToan } = body || {};


  // Lưu vào bảng PhieuHang
  const r = await directusFetch(`/items/phieuhang`, {
    method: "POST",
    body: JSON.stringify({ ID_KhachHang, Donhangs: Donhangs,TongTien,TrangThai,ID_DiaDiem,ThanhToan })

  });
  const data = await r.json();
  if (!r.ok) return NextResponse.json({ ok: false, error: data?.errors?.[0]?.message || "Create PhieuHang failed" }, { status: r.status });

  return NextResponse.json({ ok: true, id: data?.data?.ID ?? data?.data?.id, data: data?.data });
}
export async function PATCH(req: Request) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  // ❗ ĐỌC JSON RỒI STRINGIFY – KHÔNG pass thẳng req.body (tránh lỗi duplex)
  const body = await req.json().catch(() => ({}));
  // ví dụ yêu cầu có { id, ...payload }
  const { ID_KhachHang, Donhangs, TongTien, TrangThai, ID_DiaDiem, ThanhToan } = body || {};


  // Lưu vào bảng PhieuHang
  const r = await directusFetch(`/items/phieuhang`, {
    method: "POST",
    body: JSON.stringify({ ID_KhachHang, Donhangs: Donhangs,TongTien,TrangThai,ID_DiaDiem,ThanhToan })

  });
  const data = await r.json();
  if (!r.ok) return NextResponse.json({ ok: false, error: data?.errors?.[0]?.message || "Create PhieuHang failed" }, { status: r.status });

  return NextResponse.json({ ok: true, id: data?.data?.ID ?? data?.data?.id, data: data?.data });
}