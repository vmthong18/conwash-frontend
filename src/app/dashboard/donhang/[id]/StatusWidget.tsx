"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUS_ORDER = [
  "TAO_MOI",
  "CHO_LAY",
  "DANG_GIAT",
  "BAO_KHACH",
  "HOAN_THANH",
];

const STATUS_LABEL: Record<string, string> = {
  TAO_MOI: "Tạo mới",
  CHO_LAY: "Chờ lấy hàng",
  DANG_GIAT: "Đang giặt",
  BAO_KHACH: "Chờ khách lấy",
  HOAN_THANH: "Đã hoàn thành",
};

export default function StatusWidget({
  id,
  trangThai,
  idKhachHang,
}: {
  id: number | string;
  trangThai: string;
  idKhachHang?: number | string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(trangThai);
  const [isPending, startTransition] = useTransition();

  const idx = Math.max(0, STATUS_ORDER.indexOf(value));
  const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
  const isDone = value === "HOAN_THANH";

  async function save(newStatus: string) {

    if (newStatus === "BAO_KHACH") {
      router.replace(`/dashboard/donhang/edit/${id}`);

    }
    else {
      const r = await fetch("/api/v1/capnhat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: id, TrangThai: newStatus }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        alert(j?.error || `Cập nhật thất bại (${r.status})`);
        return;
      }
      // Làm tươi dữ liệu chi tiết
      startTransition(() => router.refresh());
    }

  }

  return (
    <div className="space-y-2">


      <div className="flex items-center gap-2">


        <button
          onClick={() => save(next)}
          disabled={isPending || isDone}
          className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          title={isDone ? "Đơn đã hoàn thành" : `Chuyển sang: ${STATUS_LABEL[next]}`}
        >
          {isDone ? "Đã hoàn thành" : "Tiến bước →"}
        </button>
      </div>
    </div>
  );
}
