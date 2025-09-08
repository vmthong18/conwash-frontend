"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUS_ORDER = [
  "TAO_MOI",
  "GHEP_DON",
  "LEN_DON",
  "CHO_LAY",
  "VAN_CHUYEN", 
  "DANG_GIAT",
  "GIAT_XONG",
  "CHO_VAN_CHUYEN_LAI",
  "VAN_CHUYEN_LAI",
  "QUAY_NHAN_GIAY",
  "SAN_SANG",
  "HOAN_THANH",
];

const STATUS_LABEL: Record<string, string> = {
  TAO_MOI: "Tạo mới",
  GHEP_DON: "Chờ ghép đơn ",
  LEN_DON: "Đơn hàng mới tạo",
  CHO_LAY: "Chờ vận chuyển đi giặt",
  VAN_CHUYEN:"Vận chuyển đi giặt",
  DANG_GIAT: "Đang giặt",
  GIAT_XONG: "Giặt xong",
  CHO_VAN_CHUYEN_LAI: "Chờ vận chuyển trả giày",
  VAN_CHUYEN_LAI: "Vận chuyển trả giày",
  QUAY_NHAN_GIAY: "Quầy nhận giày sạch",
  SAN_SANG: "Sẵn sàng giao",
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

    if (newStatus === "GIAT_XONG") {
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
       router.replace(`/dashboard/donhang/${id}?r=${Date.now()}`);
       
      // Làm tươi dữ liệu chi tiết
     // startTransition(() => router.refresh());
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
