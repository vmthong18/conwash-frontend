import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";
import { directusFetch } from "@/lib/directusFetch";
export async function PATCH(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const b = await req.json();
   

  // ===== 0) Chuẩn hóa dữ liệu đầu vào =====

  const donHangId = b?.ID;
  //return NextResponse.json({ ok: false, error: "line 225" + donHangId }, { status: 400 });
  const trangThai: string =
    typeof b?.TrangThai === "string" && b.TrangThai.length
      ? b.TrangThai
      : "TAO_MOI";



  // ===== 2) Tạo DON HANG (chưa có ảnh, chưa có QR) =====
  const payloadOrder: any = {


    TrangThai: trangThai,     // <— trạng thái

    // NguoiNhap: preset trong Policy (NhapDon) sẽ tự gán $CURRENT_USER
  };


  const update = await directusFetch(`/items/donhang/${donHangId}`, {
    method: "PATCH",
    body: JSON.stringify(payloadOrder),
  });
  if (!update.ok) {
    const err = await update.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "line 225" + err || "Cập nhật thất bại" }, { status: 400 });
  }

  if (trangThai === "SAN_SANG") {
    const q = new URL(`${process.env.DIRECTUS_URL}/items/phieuhang`);
    q.searchParams.set("fields", "id,Donhangs");
    q.searchParams.set("limit", "100");
    q.searchParams.set("filter[_or][0][Donhangs][_eq]", `[${donHangId}]`);
    q.searchParams.set("filter[_or][1][Donhangs][_starts_with]", `[${donHangId},`);
    q.searchParams.set("filter[_or][2][Donhangs][_ends_with]", `,${donHangId}]`);
    q.searchParams.set("filter[_or][3][Donhangs][_contains]", `,${donHangId},`);
    const listRes = await directusFetch(q.toString());
    
    if (listRes.ok) {
      const found = await listRes.json();
      const dg = (found?.data || {}) || null;
      const ids = parseDonhangs(dg[0].Donhangs);
      return NextResponse.json({ ok: false, error: `DANH SACH ID: ${JSON.stringify(ids)}` }, { status: 400 });
     // alert(`DANH SACH ID: ${JSON.stringify(ids)}`);
      if (ids.length) {
        const dhURL = new URL(`${process.env.DIRECTUS_URL}/items/donhang`);
        dhURL.searchParams.set("fields", "TrangThai");
        dhURL.searchParams.set("filter[ID][_in]", ids.join(","));
        const dhRes = await directusFetch(dhURL.toString());
        if (dhRes.ok) {
          const dh = await dhRes.json();
          const arr: any[] = dh?.data ?? [];
          const allSanSang = arr.every((item) => item.TrangThai === "SAN_SANG");
          if (allSanSang) {
            // Cập nhật phiếu sang trạng thái SAN_SANG
            await directusFetch(`/items/phieuhang/${dg[0].id}`, {
              method: "PATCH",
              body: JSON.stringify({ TrangThai: "SAN_SANG" }),
            });
          }

        }
      }
    }
  }
  function parseDonhangs(raw: any): number[] {
    if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
    if (typeof raw === "string") {
      const s = raw.trim();
      // thử JSON trước
      try {
        const j = JSON.parse(s);
        if (Array.isArray(j)) return j.map(Number).filter(Boolean);
      } catch { }
      // CSV "47,48"
      return s.split(",").map(x => parseInt(x.trim(), 10)).filter(Boolean);
    }
    return [];
  }

  const updatedData = await update.json();
  return NextResponse.json({ ok: true, data: updatedData?.data });
}
