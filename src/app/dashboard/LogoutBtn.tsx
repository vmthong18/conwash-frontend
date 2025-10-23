// src/app/dashboard/LogoutBtn.tsx
"use client";
import { LogOut } from "lucide-react";  // Thêm icon logout


export default function LogoutBtn() {
  const onClick = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };
  return (
 
    <button
      onClick={onClick}
      className="text-blue-600 hover:underline ml-auto cursor-pointer"
    >
      <LogOut size={20} className="inline-block text-gray-500" />
    </button>
  );
}
