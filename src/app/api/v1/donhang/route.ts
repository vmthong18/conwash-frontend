import { NextRequest, NextResponse } from "next/server";
import { getAccess } from "@/lib/cookies";
import QRCode from "qrcode";

export const runtime = "nodejs";

/**
 * Body:
 *  - Cách A: { ID_khachhang, GhiChu, TrangThai?, AnhFiles?: string[] }
 *  - Cách B: { Tenkhachhang, DiaChi, DienThoai, GhiChu, TrangThai?, AnhFiles?: string[] }
 *  - Lưu ý: QR sẽ được sinh sau khi tạo đơn và upload vào Directus, rồi PATCH donhang.AnhFile = id file QR.
 */
export async function POST(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const count = Math.max(1, Number(body.count || 1));
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000";
  const trangThai: string = "TAO_MOI";



  // ===== 2) Tạo DON HANG (chưa có ảnh, chưa có QR) =====
  const payloadOrder: any = {

    TrangThai: trangThai,     // <— trạng thái
    // NguoiNhap: preset trong Policy (NhapDon) sẽ tự gán $CURRENT_USER
  };
  const donhangURL: string[] = []; // <-- thêm 


  for (let i = 0; i < Math.max(1, count); i++) {
    const orderRes = await fetch(`${process.env.DIRECTUS_URL}/items/donhang?fields=ID`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payloadOrder),
    });
    if (!orderRes.ok) return NextResponse.json({ ok: false, error: await orderRes.text() }, { status: 400 });
    const orderJson = await orderRes.json();
    const donhangId: number | undefined = orderJson?.data?.ID;
    if (!donhangId) return NextResponse.json({ ok: false, error: "Không lấy được ID đơn hàng vừa tạo" }, { status: 500 });



    // ===== 4) Sinh mã QR cho link chi tiết đơn & upload vào Directus =====
    // URL hiển thị đơn (C có thể đổi sang route public nếu muốn): 

    //const orderUrl = `${appBase}/dashboard/donhang/${donhangId}`;
    const orderUrl = `${donhangId}`;
    donhangURL.push(orderUrl);
    // Tạo PNG QR (512px, viền mỏng)
    const png = await QRCode.toBuffer(orderUrl, { type: "png", width: 512, margin: 1 });

    // Upload PNG vào Directus (multipart/form-data)
    const fd = new FormData();
    // Node 20 có Blob/File sẵn; dùng Blob để tương thích
    fd.append("file", new Blob([new Uint8Array(png)], { type: "image/png" }), `qr-donhang-${donhangId}.png`);

    const uploadRes = await fetch(`${process.env.DIRECTUS_URL}/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!uploadRes.ok) {
      // Đơn đã tạo, ảnh thường đã chèn; chỉ cảnh báo QR
      return NextResponse.json(
        { ok: true, data: { ID: donhangId }, warning: `Upload QR thất bại: ${await uploadRes.text()}` },
        { status: 200 }
      );
    }
    const uploadJson = await uploadRes.json();
    const qrFileId = uploadJson?.data?.id;

    // Ghi id file QR vào cột AnhFile của donhang
    if (qrFileId) {
      await fetch(`${process.env.DIRECTUS_URL}/items/donhang/${donhangId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ AnhFile: qrFileId }),
      });
    }
  }
  // ===== 5) Trả kết quả
  //return NextResponse.json({ ok: true, data: {} });

  return NextResponse.json({
    ok: true,
    data: {
      donhangURL, // mảng chứa các ID đơn hàng đã được tạo
    },
  });

}
export async function PATCH(req: NextRequest) {
  const token = await getAccess();
  if (!token) return NextResponse.redirect('/login', 301);//return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  const STATUS_ORDER = [
    "TAO_MOI",
    "GHEP_DON",
    "LEN_DON",
    "CHO_LAY",
    "VAN_CHUYEN",
    "DANG_GIAT",
    "GIAT_XONG",
    "CHO_VAN_CHUYEN_LAI",
    "VAN_CHUYEN_LAI",
    "QUAY_NHAN_GIAY",
    "SAN_SANG",
    "HOAN_THANH",
  ];

  const b = await req.json();

  // ===== 0) Chuẩn hóa dữ liệu đầu vào =====
  const imgs: string[] = Array.isArray(b?.AnhList)
    ? b.AnhList.filter((x: any) => typeof x === "string" && x.length > 0)
    : [];
  const imgs_after: string[] = Array.isArray(b?.AnhList_After)
    ? b.AnhList_After.filter((x: any) => typeof x === "string" && x.length > 0)
    : [];
  const donhangId = b?.ID;

  //const GoiHangIDs= b?.GoiHangIDs;
  const trangThai: string =
    typeof b?.TrangThai === "string" && b.TrangThai.length
      ? b.TrangThai
      : "TAO_MOI";
  const idx = Math.max(0, STATUS_ORDER.indexOf(trangThai));
  const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
  // ===== 1) Xác định khách hàng (tìm theo SĐT, nếu chưa có thì tạo) =====
  let ID_khachhang = b?.ID_KhachHang;
  if (!ID_khachhang) {
    const { TenKhachHang, DiaChi, DienThoai } = b || {};
    if (!DienThoai) {
      return NextResponse.json({ ok: false, error: "Thiếu ID_KhachHang hoặc DienThoai" }, { status: 400 });
    }

    const findRes = await fetch(
      `${process.env.DIRECTUS_URL}/items/khachhang?filter[DienThoai][_eq]=${encodeURIComponent(DienThoai)}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!findRes.ok) return NextResponse.json({ ok: false, error: "line 115" + await findRes.text() }, { status: 400 });
    const found = await findRes.json().catch(() => ({}));
    let kh = found?.data?.[0];

    if (!kh) {
      const createRes = await fetch(`${process.env.DIRECTUS_URL}/items/khachhang`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ TenKhachHang, DiaChi, DienThoai }),
      });
      if (!createRes.ok) return NextResponse.json({ ok: false, error: "line 125" + await createRes.text() }, { status: 400 });
      const created = await createRes.json();
      kh = created?.data;
    }
    ID_khachhang = kh?.ID;

  }

  // ===== 2) Tạo DON HANG (chưa có ảnh, chưa có QR) =====
  const payloadOrder: any = {
    ID_KhachHang: ID_khachhang,
    GhiChu: b?.GhiChu ?? null,
    AnhNhan: b?.Anh ?? null,
    GoiHangs: b?.GoiHangIDs ?? null,
    NguoiNhap: b?.NguoiNhap ?? null,
    TrangThai: next,     // <— trạng thái
    ID_DiaDiem: b?.ID_DiaDiem || null,
    NhaGiat: b?.NhaGiat || null,
    // NguoiNhap: preset trong Policy (NhapDon) sẽ tự gán $CURRENT_USER
  };


  const q = new URL(`${process.env.DIRECTUS_URL}/items/donhang_anh`);
  q.searchParams.set("fields", "id");
  q.searchParams.set("limit", "500");
  q.searchParams.set("filter[don_hang][_eq]", String(donhangId));

  const listRes = await fetch(q, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const ids = (await listRes.json())?.data?.map((x: any) => x.id) ?? [];

  // 3.2 Xoá bulk theo CSV (nếu có)
  if (ids.length) {
    for (let i = 0; i < ids.length; i++) {
      const item_anh = ids[i];
      const kq = await fetch(`${process.env.DIRECTUS_URL}/items/donhang_anh/${item_anh}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

    }
  }

  if (imgs.length) {

    for (let i = 0; i < imgs.length; i++) {
      const fid = imgs[i];
      const r = await fetch(`${process.env.DIRECTUS_URL}/items/donhang_anh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ don_hang: donhangId, file: fid, sort: i }),
      });
      if (!r.ok) {
        return NextResponse.json(
          { ok: false, error: `Tạo ảnh thứ ${i + 1} thất bại: ${await r.text()}`, order_id: donhangId },
          { status: 400 }
        );
      }

    }
  }

  const q_after = new URL(`${process.env.DIRECTUS_URL}/items/donhang_anh_after`);
  q_after.searchParams.set("fields", "id");
  q_after.searchParams.set("limit", "100");
  q_after.searchParams.set("filter[don_hang][_eq]", String(donhangId));

  const listRes_after = await fetch(q_after, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const ids_after = (await listRes_after.json())?.data?.map((x: any) => x.id) ?? [];

  // 3.2 Xoá bulk theo CSV (nếu có)
  if (ids_after.length) {
    for (let i = 0; i < ids_after.length; i++) {
      const item_anh = ids_after[i];
      const kq = await fetch(`${process.env.DIRECTUS_URL}/items/donhang_anh_after/${item_anh}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

    }
  }
  if (imgs_after.length) {
    for (let i = 0; i < imgs_after.length; i++) {
      const fid = imgs_after[i];
      const r = await fetch(`${process.env.DIRECTUS_URL}/items/donhang_anh_after`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ don_hang: donhangId, file: fid, sort: i }),
      });
      if (!r.ok) {
        return NextResponse.json(
          { ok: false, error: `Tạo ảnh thứ ${i + 1} thất bại: ${await r.text()}`, order_id: donhangId },
          { status: 400 }
        );
      }
    }
  }


  const update = await fetch(`${process.env.DIRECTUS_URL}/items/donhang/${donhangId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payloadOrder),
  });
  if (!update.ok) {
    const err = await update.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "line 225" + err || "Cập nhật thất bại" }, { status: 400 });
  }

  const updatedData = await update.json();
  return NextResponse.json({ ok: true, data: updatedData?.data });
}


