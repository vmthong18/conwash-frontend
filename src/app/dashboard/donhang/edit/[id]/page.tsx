import { cookies } from "next/headers";
import Link from "next/link";
import EditForm from "./EditForm";



const ASSETS =
  process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

const STATUS_LABEL: Record<string, string> = {
  TAO_MOI: "Tạo mới",
  GHEP_DON: "Chờ ghép đơn ",
  LEN_DON: "Đơn hàng mới tạo",
  CHO_LAY: "Chờ vận chuyển đi giặt",
  VAN_CHUYEN: "Vận chuyển đi giặt",
  DANG_GIAT: "Đang giặt",
  GIAT_XONG: "Giặt xong",
  CHO_VAN_CHUYEN_LAI: "Chờ vận chuyển trả giày",
  VAN_CHUYEN_LAI: "Vận chuyển trả giày",
  QUAY_NHAN_GIAY: "Quầy nhận giày sạch",
  SAN_SANG: "Sẵn sàng giao",
  HOAN_THANH: "Đã hoàn thành",
};

export default async function EditDetail({
  params,
}: {
  params: { id: string };
}) {
  const access = (await cookies()).get(
    process.env.COOKIE_ACCESS || "be_giay_access"
  )?.value;
  if (!access) return <div className="p-8">Chưa đăng nhập.</div>;

  const { id } = await params;

  // Các trường cần lấy
  const fields = [
    "ID",
    "TrangThai",
    "GhiChu",
    "GoiHangs",
    "NguoiNhap.first_name",
    "NguoiNhap.email",
    "ID_KhachHang.ID",
    "ID_KhachHang.TenKhachHang",
    "ID_KhachHang.DienThoai",
    "ID_KhachHang.DiaChi",
    "AnhFile.id",
    "AnhNhan",
    "ID_DiaDiem",
  ].join(",");

  const url = `${process.env.DIRECTUS_URL}/items/donhang/${id}?fields=${encodeURIComponent(
    fields
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");

    return (
      <main className="p-8">
        <div className="mb-4">
          <Link href="/dashboard/donhang" className="text-blue-600 hover:underline">
            ← Danh sách
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Lỗi tải chi tiết</h1>
        <p className="text-red-600 mt-2">
          {res.status} {t}
        </p>
      </main>
    );
  }

  const { data: r } = await res.json();
  const q_after = new URL(`${process.env.DIRECTUS_URL}/items/donhang_anh_after`);
  q_after.searchParams.set("fields", "file");
  q_after.searchParams.set("limit", "100");
  q_after.searchParams.set("filter[don_hang][_eq]", String(r.ID));

  const listRes_after = await fetch(q_after, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
  const ids_after = (await listRes_after.json())?.data?.map((x: any) => x.file) ?? [];

  const q = new URL(`${process.env.DIRECTUS_URL}/items/donhang_anh`);
  q.searchParams.set("fields", "file");
  q.searchParams.set("limit", "100");
  q.searchParams.set("filter[don_hang][_eq]", String(r.ID));

  const listRes = await fetch(q, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
  const ids = (await listRes.json())?.data?.map((x: any) => x.file) ?? [];
  let me: any = null;
  const meRes = await fetch(`${process.env.DIRECTUS_URL}/users/me?fields=id,role.name,location`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store"
  });
  if (meRes.ok) {
    const meData = await meRes.json();
    me = meData?.data;
  }


  let idkh = r.ID_KhachHang?.ID;
  let tkh = r.ID_KhachHang?.TenKhachHang || "";
  let dtkh = r.ID_KhachHang?.DienThoai || "";
  let sckh = r.ID_KhachHang?.DiaChi || "";
  let dc = r.ID_DiaDiem;
  if (dc === undefined || dc === null) {
    dc = me?.location;
  }
  let locationName = "";
  if (dc) {
    const q_location_name = new URL(`${process.env.DIRECTUS_URL}/items/diadiem/${dc}`);
    const listRes_location_name = await fetch(q_location_name, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
    if (listRes_location_name.ok) {
      const found = await listRes_location_name.json();
      const dg = (found?.data || {}) || null;
      locationName = dg.TenDiaDiem || "";
    }
  }
  const q_checkghepdon = new URL(`${process.env.DIRECTUS_URL}/items/donhang`);
  q_checkghepdon.searchParams.set("filter[TrangThai][_eq]", "GHEP_DON");
  q_checkghepdon.searchParams.set("filter[ID_DiaDiem][_eq]", me.location);
  q_checkghepdon.searchParams.set("fields", "ID_KhachHang.ID,ID_KhachHang.TenKhachHang,ID_KhachHang.DienThoai,ID_KhachHang.DiaChi");

  const listRes_checkghepdon = await fetch(q_checkghepdon, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });


  if (listRes_checkghepdon.ok) {
    const found = await listRes_checkghepdon.json();

    const dg = (found?.data || []) || null;
    if (dg.length > 0) {

      idkh = dg[0].ID_KhachHang?.ID;
      tkh = dg[0].ID_KhachHang?.TenKhachHang || "";
      dtkh = dg[0].ID_KhachHang?.DienThoai || "";
      sckh = dg[0].ID_KhachHang?.DiaChi || "";
    }

  }
  const response_goihang = await fetch(`${process.env.DIRECTUS_URL}/items/goihang`, { method: "GET", headers: { "Content-Type": "application/json" } }); // Chỉnh lại endpoint API của bạn nếu cần
  const listRes_goihang = await response_goihang.json();
   const data_goihang = (listRes_goihang?.data || []) || null;
  return (
    <EditForm
      id={r.ID}
      trangThai={r.TrangThai}
      ghiChu={r.GhiChu}
      firstName={r.NguoiNhap?.first_name || ""}

      idKhachHang={idkh}
      tenKhachHang={tkh}
      dienThoai={dtkh}
      diaChi={sckh}
      goiHangIDs={r.GoiHangs || []}
      listGoiHang={data_goihang}
      anhNhan={r.AnhNhan}
      anhList_after={ids_after}
      anhList={ids}
      me={me?.id}
      roleName={me?.role?.name || ""}
      locationId={dc}
      locationName={locationName}
    />
  );
}
