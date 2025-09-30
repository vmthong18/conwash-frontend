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

  async function onClick() {
    try {
      setLoading(true);
      const api =
        process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
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
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Đang cập nhật..." : label}
    </button>
  );
}
