// src/app/dashboard/LogoutBtn.tsx
"use client";
import { directusFetch } from "@/lib/directusFetch";

export default function LogoutBtn() {
  const onClick = async () => {
    await directusFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };
  return (
    <button onClick={onClick} className="px-4 py-2 bg-gray-800 text-white rounded">
      Đăng xuất
    </button>
  );
}
