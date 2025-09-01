// src/app/dashboard/phieuhang/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";

type Search = { [k: string]: string | string[] | undefined };

function parseDonhangs(raw: any): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
  if (typeof raw === "string") {
    const s = raw.trim();
    // thử JSON trước
    try {
      const j = JSON.parse(s);
      if (Array.isArray(j)) return j.map(Number).filter(Boolean);
    } catch {}
    // CSV "47,48"
    return s.split(",").map(x => parseInt(x.trim(), 10)).filter(Boolean);
  }
  return [];
}

export default async function PhieuHangList({ searchParams }: { searchParams: Search }) {
  const jar = await cookies();
  const token = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!token) return <div className="p-8">Chưa đăng nhập.</div>;

  const page  = Math.max(1, Number(searchParams.page ?? 1));
  const limit = Number(searchParams.limit ?? 10);
  const offset = (page - 1) * limit;

  const API    = process.env.DIRECTUS_URL!;
  const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

  // Lấy danh sách phiếu
  const q = new URL(`${API}/items/phieuhang`);
  q.searchParams.set("limit", String(limit));
  q.searchParams.set("offset", String(offset));
  q.searchParams.set("sort", "-id");
  q.searchParams.set("fields", "id,ID_KhachHang,Donhangs,TongTien"); // lấy đủ trường cần

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

    // Đơn trong phiếu → lấy ảnh AnhNhan
    const ids = parseDonhangs(p.Donhangs);
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
      imgs,                            // danh sách id ảnh
      tong: Number(p.TongTien ?? 0),
    };
  }));

  const hasNext = phieuRows.length === limit;

  return (
    <main className="p-6">
     
  <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phiếu hàng</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Về Dashboard</Link>
          {/* Nút nhập đơn hàng */}
          <Link href="/dashboard/phieuhang/tao" className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            + Nhập đơn hàng
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b w-16">#</th>
              <th className="p-2 border-b text-left">Tên khách hàng</th>
              <th className="p-2 border-b text-left">Số điện thoại</th>
              <th className="p-2 border-b text-left">Ảnh khi nhận (mỗi đơn 1 ảnh)</th>
              <th className="p-2 border-b text-right">Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b">
                <td className="p-2 text-center">#{r.id}</td>
                <td className="p-2">{r.kh.TenKhachHang || "-"}</td>
                <td className="p-2">{r.kh.DienThoai || "-"}</td>
                <td className="p-2">
                  {r.imgs.length ? (
                    <div className="flex gap-2">
                      {r.imgs.map((id, idx) => (
                        <a key={idx} href={`${ASSETS}/assets/${id}`} target="_blank" rel="noreferrer">
                          <img
                            src={`${ASSETS}/assets/${id}?width=64&height=64&fit=cover`}
                            className="h-12 w-12 rounded border object-cover"
                            alt="Ảnh nhận"
                        
                          />
                        </a>
                      ))}
                    </div>
                  ) : "–"}
                </td>
                <td className="p-2 text-right">
                  {r.tong.toLocaleString("vi-VN")} đ
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
    </main>
  );
}
