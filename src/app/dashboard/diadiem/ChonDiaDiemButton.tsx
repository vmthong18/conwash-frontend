"use client";
import { redirect, useRouter } from "next/navigation";

export default function ChonDiaDiemButton({ id }: { id: string }) {
    const router = useRouter();
    function onSubmit(id: string | undefined) {

        try {
            const body: any = { id };
            fetch('/api/v1/location', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); // Chỉnh lại endpoint API của bạn nếu cần
            router.replace("/dashboard");

        }
        catch (e: any) {
            alert(`Lỗi: ${e.message || e.toString()}`);
        }

    }
    return (
        <button
            onClick={() => onSubmit(id)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            Chọn
        </button>
    );
}
