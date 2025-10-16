// src/app/dashboard/phieuhang/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import ActionButton from "./ActionButton";
import { MapPin, ChevronDown } from "lucide-react";

type Search = { [k: string]: string | string[] | undefined };
const STATUS_BADGE: Record<string, string> = {
  DANG_XU_LY: "bg-green-50 text-green-700",
  SAN_SANG: "bg-emerald-50 text-emerald-700",
  HOAN_THANH: "bg-slate-100 text-slate-700",
};
const STATUS_LABEL: Record<string, string> = {
  DANG_XU_LY: "Đang xử lý",
  SAN_SANG: "Sẵn sàng",
  HOAN_THANH: "Đã hoàn thành",
};
const STATUS_ORDER = [
  "DANG_XU_LY",
  "SAN_SANG",
  "HOAN_THANH",
];
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

export default async function PhieuHangList({ searchParams }: { searchParams: Search }) {
   const params = await searchParams;  
  const jar = await cookies();
  const token = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!token) return <div className="p-8">Chưa đăng nhập.</div>;

  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Number(params.limit ?? 10);
  const offset = (page - 1) * limit;

  const API = process.env.DIRECTUS_URL!;
  const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

  // Lấy danh sách phiếu
  const q = new URL(`${API}/items/phieuhang`);
  q.searchParams.set("limit", String(limit));
  q.searchParams.set("offset", String(offset));
  q.searchParams.set("sort", "-id");
  q.searchParams.set("fields", "id,ID_KhachHang,Donhangs,TongTien,TrangThai,ID_DiaDiem"); // lấy đủ trường cần

  const res = await fetch(q.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return <div className="p-6 text-red-600">Lỗi lấy phiếu: {res.status} {t}</div>;
  }

  const data = await res.json();
  const phieuRows: any[] = data?.data ?? [];

  // Lấy thông tin khách cho từng phiếu + ảnh AnhNhan của các đơn trong phiếu
  const rows = await Promise.all(phieuRows.map(async (p) => {
    // Khách
    let kh = { TenKhachHang: "-", DienThoai: "-" };
    if (p.ID_KhachHang) {
      const khRes = await fetch(
        `${API}/items/khachhang/${p.ID_KhachHang}?fields=TenKhachHang,DienThoai`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (khRes.ok) kh = await khRes.json().then(j => j.data || kh);
    }

    let dd = { TenDiaDiem: "Không xác định"};
    if (p.ID_DiaDiem) {
      const ddRes = await fetch(
        `${API}/items/diadiem/${p.ID_DiaDiem}?fields=TenDiaDiem`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (ddRes.ok) dd = await ddRes.json().then(k => k.data || dd);
    }

    // Đơn trong phiếu → lấy ảnh AnhNhan
    let ids = parseDonhangs(p.Donhangs);
    let imgs: string[] = [];
    if (ids.length) {
      const dhURL = new URL(`${API}/items/donhang`);
      dhURL.searchParams.set("fields", "ID,AnhNhan");
      dhURL.searchParams.set("filter[ID][_in]", ids.join(","));
      const dhRes = await fetch(dhURL.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (dhRes.ok) {
        const dh = await dhRes.json();
        const arr: any[] = dh?.data ?? [];
        imgs = arr.map(r => r?.AnhNhan).filter(Boolean);
      }
    }

    return {
      id: p.id,
      kh,
      dd,
      imgs,     
      ids,                       // danh sách id ảnh
      tong: Number(p.TongTien ?? 0),
      tt: String(p.TrangThai),
    };
  }));

  function getNextStatus(current: string | undefined, id: string | undefined) {
    if (!current) return current;
    const idx = STATUS_ORDER.indexOf(current.trim());
    //if (idx === -1 || idx === STATUS_ORDER.length - 1) return current+"___"+idx+"___"+STATUS_ORDER.length ;

    if (idx == 1) return (
      <ActionButton id={String(id)} token={token} label="Hoàn thành" />
    );
    return STATUS_LABEL[STATUS_ORDER[idx]];
  }
  const hasNext = phieuRows.length === limit;

  return (
    <main className="p-6">

    
   

      {/* phân trang */}
      <div className="mt-4 flex gap-2">
        <Link href={`?page=${Math.max(1, page - 1)}&limit=${limit}`} className="px-3 py-1 border rounded">
          ← Trước
        </Link>
        <Link href={`?page=${hasNext ? page + 1 : page}&limit=${limit}`}
          className={`px-3 py-1 border rounded ${hasNext ? "" : "opacity-50 pointer-events-none"}`}>
          Sau →
        </Link>
      </div>



        {/* Header nhẹ */}
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur">
        <div className="mx-auto max-w-sm px-4 py-3">
          <h1 className="text-[20px] font-semibold">Danh sách đơn hàng</h1>
        </div>
      </div>

      {/* Ô chọn địa điểm */}
      <div className="mx-auto max-w-sm px-4">
        <div className="rounded-2xl border bg-white p-3 shadow-sm flex items-start gap-3">
          <div className="rounded-full bg-blue-50 p-2">
            <MapPin size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {rows[0]?.dd?.TenDiaDiem || "Chưa chọn địa điểm"}
            </div>
            <div className="text-[13px] text-gray-600">
              {/* Nếu có địa chỉ chi tiết thì render ở đây */}
              {/* Ví dụ: 10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh */}
            </div>
          </div>
          <ChevronDown size={18} className="text-gray-500" />
        </div>
      </div>

      {/* Danh sách phiếu */}
      <ul className="mx-auto max-w-sm p-4 space-y-3">
        {rows.map((r) => {
          const badge = STATUS_BADGE[r.tt] || "bg-slate-100 text-slate-700";
          return (
            <li key={r.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm">
              {/* Header ID + trạng thái */}
              <div className="flex items-center justify-between px-4 pt-3">
                <div className="text-[13px] text-gray-600 font-medium">
                  ID đơn hàng: #{r.id}
                </div>
                <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${badge}`}>
                  {STATUS_LABEL[r.tt] ?? r.tt}
                </span>
              </div>

              {/* Thông tin KH + grid ảnh */}
              <div className="px-4 pt-2 pb-3">
                <div className="font-semibold">
                  {r.kh.TenKhachHang || "-"}{" "}
                  <span className="text-gray-400">•</span>{" "}
                  {r.kh.DienThoai || "-"}
                </div>

                {/* Grid ảnh + mã #id mỗi ảnh */}
                {r.imgs.length ? (
                  <div className="mt-2 border-dashed border-t pt-2">
                    <div className="grid grid-cols-4 gap-2">
                      {r.imgs.slice(0, 4).map((fid, idx) => (
                        <a
                          key={idx}
                          href={`${ASSETS}/assets/${fid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={`${ASSETS}/assets/${fid}?width=88&height=88&fit=cover`}
                            className="h-20 w-20 rounded-md border object-cover"
                            alt={`Ảnh đơn #${r.ids[idx] ?? ""}`}
                          />
                          <div className="text-[11px] text-gray-500 mt-1">
                            #{r.ids[idx] ?? ""}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Tổng tiền */}
                <div className="mt-3 flex justify-between border-t pt-2">
                  <span className="text-[14px] text-gray-500">Tổng tiền</span>
                  <span className="font-bold">{r.tong.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Phân trang (nếu cần) */}
      <div className="mx-auto max-w-sm px-4 pb-28">
        <div className="mt-2 flex gap-2 justify-between">
          <Link
            href={`?page=${Math.max(1, page - 1)}&limit=${limit}`}
            className="px-3 py-2 rounded-2xl border bg-white shadow-sm text-sm"
          >
            ← Trước
          </Link>
          <Link
            href={`?page=${hasNext ? page + 1 : page}&limit=${limit}`}
            className={`px-3 py-2 rounded-2xl border bg-white shadow-sm text-sm ${hasNext ? "" : "opacity-50 pointer-events-none"}`}
          >
            Sau →
          </Link>
        </div>
      </div>

      {/* Nút tạo đơn hàng (sticky đáy) */}
      <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-sm p-4">
          <Link
            href="/dashboard/phieuhang/tao"
            className="block w-full text-center rounded-2xl bg-blue-600 py-3 text-white font-medium"
          >
            Tạo đơn hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
