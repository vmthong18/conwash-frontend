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
  const base =
    "w-full rounded-2xl px-4 py-3 text-center font-medium transition " +
    "shadow-[0_6px_14px_-6px_rgba(37,99,235,.45)] focus:outline-none focus:ring-2 focus:ring-blue-500 " +
    "active:scale-[0.99] disabled:opacity-60";
  async function onClick() {
    try {
      setLoading(true);
      const api = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS;
      if (!api) throw new Error("Thiếu cấu hình DIRECTUS_URL.");

      const res = await fetch(`${api}/items/phieuhang/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ TrangThai: "HOAN_THANH" }),
      });

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
      className={`${base} bg-gradient-to-b from-blue-500 to-blue-600 text-white`}

    >
      {loading ? "Đang cập nhật..." : label}
    </button>
  );
}
