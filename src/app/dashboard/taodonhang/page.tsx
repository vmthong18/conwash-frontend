import { cookies } from "next/headers";
import Link from "next/link";
import TaoQRForm from "./TaoQRForm"; 

type Search = { [k: string]: string | string[] | undefined };

export default async function TaoDonHangPage({ searchParams }: { searchParams: Search }) {
  const jar = await cookies();
  const access = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!access) return <div className="p-8">Chưa đăng nhập.</div>;

  const limit = Number(searchParams.limit ?? 10);
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const offset = (page - 1) * limit;
  const q = "TAO_MOI";              // từ khóa: tên hoặc SĐT
  const sort = (searchParams.sort as string) || "-ID";     // mặc định ID giảm dần

  const url = new URL(`${process.env.DIRECTUS_URL}/items/DonHang`);
  const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

  const assetUrl = (id: string, size = 96) =>
    `${ASSETS}/assets/${id}?width=${size}&height=${size}&fit=cover`;
  const taoQR = async () => {
    const res = await fetch("/api/v1/donhang", {
      method: "POST",
      body: JSON.stringify({}),
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
    "ID,AnhFile.id"
  );

  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", sort);

  // Tìm theo tên KH hoặc số điện thoại (deep filter qua quan hệ)

  url.searchParams.set("filter[TrangThai][_eq]", q);



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
    sp.set("filter[TrangThai][_eq]", q);
    return `?${sp.toString()}`;
  };

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Về Dashboard</Link>

        </div>
      </div>

      {/* Thanh tìm kiếm */}
       <TaoQRForm />

      {/* Bảng */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <Th label="ID" sort="ID" current={sort} />
              <th className="text-left p-2 border-b">QR</th>


            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ID} className="border-b">
                <td className="p-2">{r.ID}</td>


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
