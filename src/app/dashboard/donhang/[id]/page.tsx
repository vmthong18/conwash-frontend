import { cookies } from "next/headers";
import Link from "next/link";
import StatusWidget from "./StatusWidget";
import { redirect, notFound } from "next/navigation";


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

export default async function donhangDetail({
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
  const st = String(r?.TrangThai ?? "");
  const isTaoMoi = ["TAO_MOI", "tao_moi", "TaoMoi", "taomoi"].includes(st);
  if (isTaoMoi) {
    redirect(`/dashboard/donhang/edit/${id}`); // <-- chuyển về danh sách
  }


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
  let dc = r.ID_DiaDiem;

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

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn hàng #{r.ID} - {locationName} </h1>
        <Link href="/dashboard/donhang" className="text-blue-600 hover:underline">
          ← Danh sách
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cột thông tin + ảnh */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded border p-4">
            <div className="font-semibold mb-2">Thông tin khách hàng</div>
            <div>Tên: {r.ID_KhachHang?.TenKhachHang ?? "-"}</div>
            <div>Điện thoại: {r.ID_KhachHang?.DienThoai ?? "-"}</div>
            <div>Địa chỉ: {r.ID_KhachHang?.DiaChi ?? "-"}</div>
          </div>

          <div className="rounded border p-4">
            <div className="font-semibold mb-2">Ghi chú</div>
            <div className="whitespace-pre-wrap">{r.GhiChu ?? "-"}</div>
          </div>

          <div className="rounded border p-4">
            <div className="font-semibold mb-2">Ảnh trước</div>
            <div className="flex gap-2 flex-wrap">
              {(Array.isArray(ids) ? ids : []).map(
                (it: any, i: number) => (
                  <a
                    key={i}
                    href={`${ASSETS}/assets/${it}`}
                    target="_blank"
                  >
                    <img
                      src={`${ASSETS}/assets/${it}?width=160&height=160&fit=cover`}
                      className="h-32 w-32 object-cover rounded border"
                    />
                  </a>
                )
              )}
            </div>
          </div>


          <div className="rounded border p-4">
            <div className="font-semibold mb-2">Ảnh sau</div>
            <div className="flex gap-2 flex-wrap">
              {(Array.isArray(ids_after) ? ids_after : []).map(
                (it: any, i: number) => (
                  <a
                    key={i}
                    href={`${ASSETS}/assets/${it}`}
                    target="_blank"
                  >
                    <img
                      src={`${ASSETS}/assets/${it}?width=160&height=160&fit=cover`}
                      className="h-32 w-32 object-cover rounded border"
                    />
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* Cột trạng thái + QR */}
        <aside className="space-y-4">
          <div className="rounded border p-4">
            <div className="font-semibold mb-2">Trạng thái hiện tại</div>
            <div className="text-lg mb-3">
              {STATUS_LABEL[r.TrangThai] ?? r.TrangThai}
            </div>
            {/* Nút submit / tiến bước */}
            <StatusWidget id={r.ID} trangThai={r.TrangThai} idKhachHang={r.ID_KhachHang} />
          </div>

          <div className="rounded border p-4">
            <div className="font-semibold mb-2">QR đơn hàng</div>
            {r?.AnhFile?.id ? (
              <a href={`${ASSETS}/assets/${r.AnhFile.id}`} target="_blank">
                <img
                  src={`${ASSETS}/assets/${r.AnhFile.id}?width=256&height=256`}
                  className="w-48 h-48 bg-white border p-2 rounded"
                />
              </a>
            ) : (
              <div>-</div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
