import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";
export async function PATCH(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });

  const b = await req.json();

  // ===== 0) Chuẩn hóa dữ liệu đầu vào =====
 
  const donHangId = b?.ID;
  const trangThai: string =
    typeof b?.TrangThai === "string" && b.TrangThai.length
      ? b.TrangThai
      : "TAO_MOI";

  

  // ===== 2) Tạo DON HANG (chưa có ảnh, chưa có QR) =====
  const payloadOrder: any = {
   
   
    TrangThai: trangThai,     // <— trạng thái

    // NguoiNhap: preset trong Policy (NhapDon) sẽ tự gán $CURRENT_USER
  };


  const update = await fetch(`${process.env.DIRECTUS_URL}/items/DonHang/${donHangId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payloadOrder),
  });
  if (!update.ok) {
    const err = await update.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "line 225"+err || "Cập nhật thất bại" }, { status: 400 });
  }

  const updatedData = await update.json();
  return NextResponse.json({ ok: true, data: updatedData?.data });
}
