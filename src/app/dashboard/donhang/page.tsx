import { cookies } from "next/headers";
import Link from "next/link";

type Search = { [k: string]: string | string[] | undefined };

export default async function DonHangPage({ searchParams }: { searchParams: Search }) {
  const jar = await cookies();
  const access = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!access) return <div className="p-8">Chưa đăng nhập.</div>;

  const limit = Number(searchParams.limit ?? 10);
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const offset = (page - 1) * limit;
  const q = (searchParams.q as string) || "";              // từ khóa: tên hoặc SĐT
  const sort = (searchParams.sort as string) || "-ID";     // mặc định ID giảm dần

  const url = new URL(`${process.env.DIRECTUS_URL}/items/DonHang`);
  const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

  const assetUrl = (id: string, size = 96) =>
    `${ASSETS}/assets/${id}?width=${size}&height=${size}&fit=cover`;
  const updateTrangThai = async (donHangId: string, trangThai: string) => {
    const res = await fetch("/api/v1/donhang", {
      method: "PATCH",
      body: JSON.stringify({ donHangId, trangThai }),
    });

    const data = await res.json();

    if (data.ok) {
      alert("Trạng thái đơn hàng đã được cập nhật!");
      // Bạn có thể trigger lại fetch data để cập nhật UI
    } else {
      alert(`Lỗi: ${data.error}`);
    }
  };

  // Expand các trường khách hàng để hiển thị
  url.searchParams.set("fields",
    "ID,TrangThai,GhiChu,ID_KhachHang.ID,ID_KhachHang.TenKhachHang,ID_KhachHang.DienThoai,NguoiNhap.first_name,NguoiNhap.email,AnhList.file.id,AnhFile.id"
  );

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", sort);
  url.searchParams.set("filter[TrangThai][_neq]", "TAO_MOI");
  // Tìm theo tên KH hoặc số điện thoại (deep filter qua quan hệ)
  if (q) {
    url.searchParams.set("filter[_or][0][ID_KhachHang][TenKhachHang][_contains]", q);
    url.searchParams.set("filter[_or][1][ID_KhachHang][DienThoai][_contains]", q);
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

  const json = await res.json();
  const rows: any[] = json?.data ?? [];
  const hasPrev = page > 1;
  const hasNext = rows.length === limit;

  const paramsFor = (p: number) => {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    sp.set("limit", String(limit));
    sp.set("sort", sort);
    if (q) sp.set("q", q);
    return `?${sp.toString()}`;
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Về Dashboard</Link>
          {/* Nút nhập đơn hàng */}
          <Link href="/dashboard/donhang/nhap" className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            + Nhập đơn hàng
          </Link>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <form method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nhập tên KH hoặc SĐT…"
          className="border rounded px-3 py-2 w-72"
        />
        <input type="hidden" name="limit" value={limit} />
        <input type="hidden" name="sort" value={sort} />
        <button className="px-4 py-2 bg-gray-800 text-white rounded">Tìm</button>
      </form>

      {/* Bảng */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <Th label="ID" sort="ID" current={sort} />
              <th className="text-left p-2 border-b">Tên khách hàng</th>
              <th className="text-left p-2 border-b">Số điện thoại</th>

              <th className="text-left p-2 border-b">Ảnh</th>
              <th className="text-left p-2 border-b">QR</th>
              <th className="text-left p-2 border-b">Người nhập</th>
              
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ID} className="border-b">
                <td className="p-2">{r.ID}</td>
                <td className="p-2">{r?.ID_KhachHang?.TenKhachHang ?? "-"}</td>
                <td className="p-2">{r?.ID_KhachHang?.DienThoai ?? "-"}</td>

                <td className="p-2">
                  {Array.isArray(r?.AnhList) && r.AnhList.length
                    ? r.AnhList.slice(0, 3).map((it: any, i: number) => (
                      <a key={i} href={`${process.env.DIRECTUS_URL}/assets/${it.file.id}`} target="_blank" className="mr-1 underline">
                        ảnh{i + 1}
                      </a>
                    ))
                    : "-"}
                </td>
                <td className="p-2">
                  {r?.AnhFile?.id ? (
                    <a
                      href={`${ASSETS}/assets/${r.AnhFile.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Mở QR gốc"
                    >
                      <img
                        src={assetUrl(r.AnhFile.id, 64)}
                        alt="QR"
                        className="h-12 w-12 rounded border bg-white p-1 object-contain"
                      />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-2">
                  {r?.NguoiNhap
                    ? (r.NguoiNhap.first_name || r.NguoiNhap.email || r.NguoiNhap.id)
                    : "-"}
                </td>
               
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="mt-4 flex items-center gap-3">
        <span>Trang {page}</span>
        <div className="flex gap-2">
          {hasPrev ? (
            <Link href={paramsFor(page - 1)} className="px-3 py-1 border rounded">← Trước</Link>
          ) : <span className="px-3 py-1 border rounded opacity-50">← Trước</span>}
          {hasNext ? (
            <Link href={paramsFor(page + 1)} className="px-3 py-1 border rounded">Sau →</Link>
          ) : <span className="px-3 py-1 border rounded opacity-50">Sau →</span>}
        </div>
      </div>
    </main>
  );
}

function Th({ label, sort, current }: { label: string; sort: string; current: string }) {
  const dir = current === sort ? "-" + sort : sort; // toggle
  const sp = new URLSearchParams();
  sp.set("page", "1");
  sp.set("limit", "10");
  sp.set("sort", dir);
  return (
    <th className="text-left p-2 border-b">
      <a href={`?${sp.toString()}`} className="hover:underline">{label}</a>
      {current === sort ? " ▲" : (current === "-" + sort ? " ▼" : "")}
    </th>
  );
}
