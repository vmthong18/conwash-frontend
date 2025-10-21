// (ví dụ) src/app/dashboard/phieu/tao/page.tsx
import CreatePhieuForm from "./CreatePhieuForm";
import { cookies } from "next/headers";
import { directusFetch } from "@/lib/directusFetch";

export default async function Page() {
  const jar = await cookies();
  const access = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value!;
  const base = process.env.DIRECTUS_URL!;
  let me: any = null;
  const meRes = await directusFetch(`${process.env.DIRECTUS_URL}/users/me`);
  if (meRes.ok) {
    const meData = await meRes.json();
    me = meData?.data;
  }

  // Đơn ở trạng thái GHEP_DON
  const ordersRes = await directusFetch(
    `${base}/items/donhang?fields=ID,GhiChu,GoiHangs,ID_KhachHang.ID,ID_KhachHang.TenKhachHang,ID_KhachHang.DienThoai,ID_DiaDiem,AnhNhan&filter[TrangThai][_eq]=GHEP_DON&limit=-1&filter[NguoiNhap][_eq]=${me.id}&filter[ID_DiaDiem][_eq]=${me.location}`
  );
  const orders = (await ordersRes.json()).data ?? [];

  // Danh mục gói hàng
  const goiRes = await directusFetch(
    `${base}/items/goihang?fields=ID,TenGoi,GiaTien&limit=-1`
  );
  const goiHang = (await goiRes.json()).data ?? [];

  return <CreatePhieuForm orders={orders} goiHang={goiHang} token={access} />;
}
