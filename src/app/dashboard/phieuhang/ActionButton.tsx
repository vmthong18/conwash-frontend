"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function ActionButton({
  id,
  token,
  label = "Đánh dấu hoàn thành",
}: { id: string; token?: string; label?: string }) {
  const router = useRouter();                    // ← đưa hook ra top-level
  const [loading, setLoading] = useState(false);
  const sizeCls = "px-3 py-2 text-sm rounded-xl";


  const base =
    `block w-[66%] mx-auto ${sizeCls} text-center font-medium transition
     shadow-[0_6px_14px_-6px_rgba(37,99,235,.35)]
     focus:outline-none focus:ring-2 focus:ring-blue-500
     active:scale-[0.99] disabled:opacity-60 `;
  let tt = JSON.stringify({ id: id, ThanhToan: 1 });
  if (label == "Hoàn thành") tt = JSON.stringify({ id: id, TrangThai: "HOAN_THANH" });
  async function onClick() {
    try {
      setLoading(true);
      const api = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS;
      if (!api) throw new Error("Thiếu cấu hình DIRECTUS_URL.");


      const res = await fetch(`/api/v1/phieuhang`, {
        method: "PATCH",
        body: tt
      });

      if (label == "Hoàn thành") { 

        
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${t}`);
      }

      router.refresh();                           // làm mới trang
    } catch (e: any) {
      alert(`Lỗi: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${base} bg-gradient-to-b from-emerald-500 to-emerald-600 text-white`}

    >
      {loading ? "Đang cập nhật..." : label}
    </button>
  );
}
