// src/app/dashboard/diadiem/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import ChonDiaDiemButton from "./ChonDiaDiemButton";
import Image from "next/image";
import { ChevronRight, Store } from "lucide-react";
import { directusFetch } from "@/lib/directusFetch";

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

  const res = await directusFetch(url.toString(), {
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
    <main className="min-h-dvh bg-gray-50">
      {/* Logo */}
      <div className="pt-6 flex justify-center">
        {/* Đặt logo tại /public/conwash-logo.png hoặc .svg */}
        <Image src="/conwash-logo.png" alt="CONWASH" width={140} height={60} priority />
      </div>

      {/* Tiêu đề */}
      <div className="mx-auto max-w-sm px-4 mt-4">
        <h1 className="text-[20px] font-semibold">Địa điểm đang hoạt động</h1>
      </div>

      {/* Danh sách địa điểm */}
      <ul className="mx-auto max-w-sm p-4 space-y-3">
        {rows.map((r) => (
          <li key={r.ID} className="rounded-3xl bg-white border border-gray-100 shadow-sm">
            <ChonDiaDiemButton id={String(r.ID)} className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-50 p-2">
                  <Store size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[16px] leading-tight">
                    {r.TenDiaDiem}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5 truncate">
                    { `Địa chỉ của ${r.TenDiaDiem}`}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
              </div>
            </ChonDiaDiemButton>
          </li>
        ))}

        {rows.length === 0 && (
          <li className="text-center text-gray-500 py-8">Chưa có địa điểm hoạt động</li>
        )}
      </ul>
    </main>
  );
}
