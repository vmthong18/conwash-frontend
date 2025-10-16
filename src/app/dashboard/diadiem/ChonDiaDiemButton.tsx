"use client";
import { redirect, useRouter } from "next/navigation";

export default function ChonDiaDiemButton({ id,
    children,
    className = "",
}: {
    id: string;
    children: React.ReactNode;
    className?: string;
}) {
    const router = useRouter();
    async function onSubmit(id: string | undefined) {

        try {
            const body: any = { id };
            await fetch('/api/v1/location', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); // Chỉnh lại endpoint API của bạn nếu cần


        }
        catch (e: any) {
            alert(`Lỗi: ${e.message || e.toString()}`);
        }
        router.replace("/dashboard");
    }
    return (
        <button
            onClick={() => onSubmit(id)}
            className={`block w-full text-left ${className}`}
        >
            {children}
        </button>
    );
}
