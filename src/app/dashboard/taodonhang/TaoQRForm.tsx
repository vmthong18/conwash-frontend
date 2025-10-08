"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function TaoQRForm() {
    const router = useRouter();
    const [n, setN] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [err, setErr] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            // Gọi API tạo n đơn "trạng thái TAO_MOI", POST /api/v1/donhang

            const r = await fetch("/api/v1/donhang", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: n }),            // nếu API của bạn nhận thêm tham số thì truyền ở đây
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j.ok) throw new Error(j.error || "Tạo đơn thất bại");
            const urls: string[] = j.data?.donhangURL || [];
           
           
            generateExcel(urls);
            // refresh lại danh sách
            startTransition(() => router.refresh());
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }
    function generateExcel(urls: string[]) {
        // Tạo một worksheet từ mảng URLs
        const ws = XLSX.utils.aoa_to_sheet([['URL'], ...urls.map(url => [url])]);

        // Tạo một workbook chứa worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'URLs');

        // Tạo file Excel và tải về
        const excelFile = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelFile], { type: 'application/octet-stream' });
        saveAs(blob, 'urls.xlsx');
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
            <input
                type="number"
                min={1}
                value={n}
                onChange={(e) => setN(parseInt(e.target.value || "1", 10))}
                className="border rounded px-3 py-2 w-40"
                placeholder="Số lượng QR cần tạo"
            />
            <button
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-60"
                disabled={loading || isPending}
            >
                {loading || isPending ? "Đang tạo…" : "Tạo"}
            </button>
            {err && <span className="text-red-600 text-sm ml-2">{err}</span>}
        </form>
    );
}
