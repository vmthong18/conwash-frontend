// src/app/dashboard/diadiem/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import ChonDiaDiemButton from "./ChonDiaDiemButton";

type DiaDiem = { ID: number; TenDiaDiem: string };

export const dynamic = "force-dynamic";

export default async function DiaDiemPage() {
  const jar = await cookies();
  const access =
    jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;

  if (!access) {
    return <main className="p-8">Chưa đăng nhập.</main>;
  }

  const base = process.env.DIRECTUS_URL!;
  const url = new URL(`${base}/items/diadiem`);
  url.searchParams.set("fields", "ID,TenDiaDiem,TrangThai");
  url.searchParams.set("filter[TrangThai][_eq]", "HoatDong");
  url.searchParams.set("sort", "TenDiaDiem");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Địa điểm</h1>
        <p className="text-red-600 mt-4">
          Lỗi tải dữ liệu: {res.status} {t}
        </p>
      </main>
    );
  }

  const json = await res.json();
  const rows: DiaDiem[] = json?.data ?? [];

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Địa điểm đang hoạt động</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Về Dashboard
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2 border-b w-24">ID</th>
              <th className="text-left p-2 border-b">Tên địa điểm</th>
              <th className="text-left p-2 border-b w-40">Chọn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ID} className="border-b">
                <td className="p-2">#{r.ID}</td>
                <td className="p-2">{r.TenDiaDiem}</td>
                <td className="p-2">
                 <ChonDiaDiemButton id={r.ID.toString()} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={3}>
                  Chưa có địa điểm hoạt động
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
