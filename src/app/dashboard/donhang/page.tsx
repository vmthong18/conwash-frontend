import { cookies } from "next/headers";
import Link from "next/link";
import ListDonHang from "./ListDonHangForm";

type Search = { [k: string]: string | string[] | undefined };

export default async function donhangPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const jar = await cookies();
  const access = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!access) return <div className="p-8">Chưa đăng nhập.</div>;
  const meRes = await fetch(
    `${process.env.DIRECTUS_URL}/users/me?fields=role.name,location`,
    { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" }
  );

  let roleName = "";
  let locationid = "";
  if (meRes.ok) {
    const me = await meRes.json();
    roleName = me?.data?.role?.name ?? "";
   locationid = me?.data?.location?? ""

  }
  const limit = Number(params.limit ?? 10);
  const page = Math.max(1, Number(params.page ?? 1));
  const offset = (page - 1) * limit;
  const q = (params.q as string) || "";              // từ khóa: tên hoặc SĐT
  const g = (params.g as string) || "ALL";        // trạng thái đơn hàng
  const sort = (params.sort as string) || "-ID";     // mặc định ID giảm dần


  const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

  const assetUrl = (id: string, size = 96) => `${ASSETS}/assets/${id}?width=${size}&height=${size}&fit=cover`;
  const updateTrangThai = async (donhangId: string, trangThai: string) => {
    const res = await fetch("/api/v1/donhang", {
      method: "PATCH",
      body: JSON.stringify({ donhangId, trangThai }),
    });

    const data = await res.json();

    if (data.ok) {
      alert("Trạng thái đơn hàng đã được cập nhật!");
      // Bạn có thể trigger lại fetch data để cập nhật UI
    } else {
      alert(`Lỗi: ${data.error}`);
    }
  };
  const url = new URL(`${process.env.DIRECTUS_URL}/items/donhang`);
  // Expand các trường khách hàng để hiển thị
  url.searchParams.set("fields",
    "ID,TrangThai,GhiChu,ID_KhachHang.ID,ID_KhachHang.TenKhachHang,ID_KhachHang.DienThoai,NguoiNhap.first_name,NguoiNhap.email,AnhList.file.id,AnhFile.id"
  );

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", sort);
  url.searchParams.set("filter[TrangThai][_neq]", "TAO_MOI");
  if (["Giat", "Shipper"].includes(roleName)) {
    // Chỉ thấy CHO_LAY và DANG_GIAT
    url.searchParams.set("filter[TrangThai][_in]", "CHO_LAY,DANG_GIAT");
  }
   if (["Giat", "Shipper","NhanVienQuay"].includes(roleName)) {
    // Chỉ thấy CHO_LAY và DANG_GIAT
    url.searchParams.set("filter[ID_DiaDiem][_eq]",locationid);
  }
  // Tìm theo tên KH hoặc số điện thoại (deep filter qua quan hệ)
  if (q) {
    url.searchParams.set("filter[_or][0][ID_KhachHang][TenKhachHang][_contains]", q);
    url.searchParams.set("filter[_or][1][ID_KhachHang][DienThoai][_contains]", q);
  }
  if (g && g !== "ALL") {
    url.searchParams.set("filter[TrangThai][_eq]", g);

  }
  if (roleName === "Giat") {
    url.searchParams.set("filter[_or][2][TrangThai][_eq]", "CHO_LAY");
    url.searchParams.set("filter[_or][3][TrangThai][_eq]", "VAN_CHUYEN");
    url.searchParams.set("filter[_or][4][TrangThai][_eq]", "DANG_GIAT");
    url.searchParams.set("filter[_or][5][TrangThai][_eq]", "GIAT_XONG");
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <p className="text-red-600 mt-4">Lỗi tải dữ liệu: {res.status} {text}</p>
      </main>
    );
  }

  const data = (await res.json()).data ?? [];

  return <ListDonHang token={access} orders={data} sort={sort} rolename={roleName} />;

}


