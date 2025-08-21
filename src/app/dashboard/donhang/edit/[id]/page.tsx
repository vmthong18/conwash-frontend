import { cookies } from "next/headers";
import Link from "next/link";
import EditForm from "./EditForm";



const ASSETS =
  process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

const STATUS_LABEL: Record<string, string> = {
  TaoMoi: "Tạo mới",
  ChoLayHang: "Chờ lấy hàng",
  DangGiat: "Đang giặt",
  ThongBaoKhachHang: "Thông báo với khách hàng",
  DaHoanThanh: "Đã hoàn thành",
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

  const id = params.id;

  // Các trường cần lấy
  const fields = [
    "ID",
    "TrangThai",
    "GhiChu",
    "NguoiNhap.first_name",
    "NguoiNhap.email",
    "ID_KhachHang.ID",
    "ID_KhachHang.TenKhachHang",
    "ID_KhachHang.DienThoai",
    "ID_KhachHang.DiaChi",
    "AnhFile.id",
    "AnhList.file.id",
    "AnhList_After.file.id",
  ].join(",");

  const url = `${process.env.DIRECTUS_URL}/items/DonHang/${id}?fields=${encodeURIComponent(
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
  const q_after = new URL(`${process.env.DIRECTUS_URL}/items/DonHang_Anh_After`);
  q_after.searchParams.set("fields", "file");
  q_after.searchParams.set("limit", "100");
  q_after.searchParams.set("filter[don_hang][_eq]", String(r.ID));

  const listRes_after = await fetch(q_after, { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" });
  const ids_after= (await listRes_after.json())?.data?.map((x: any) => x.file) ?? [];
  return (
    <EditForm 
    id={r.ID} 
    trangThai={r.TrangThai}
      ghiChu={r.GhiChu} 
      firstName={r.NguoiNhap?.first_name||""} 
   
      idKhachHang={r.ID_KhachHang?.ID}
    tenKhachHang={r.ID_KhachHang?.TenKhachHang || ""}
    dienThoai={r.ID_KhachHang?.DienThoai || ""} 
    diaChi={r.ID_KhachHang?.DiaChi || ""}
    anhList_after={ids_after}
    anhList={r.AnhList?.map((a: any) => a.file.id) || []}
    aCcess={access}/>
  );
}
