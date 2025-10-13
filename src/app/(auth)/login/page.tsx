"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const from = useSearchParams().get("from") || "/dashboard/default";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data?.error || "Đăng nhập thất bại");
      router.replace(from);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {/* Thay ảnh logo đúng của anh vào /public/logo-conwash.png|svg */}
          <img src="/conwash-logo.png" alt="Conwash" width={140} height={72}/>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="bg-transparent"
        >
          {/* Username / Email */}
          <label className="sr-only">Tên đăng nhập</label>
          <input
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[15px] placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Nhập tên đăng nhập"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <label className="sr-only">Mật khẩu</label>
          <input
            className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-[15px] placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Nhập tên mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Error */}
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}

          {/* Submit button */}
          <button
            className="mt-4 w-full rounded-2xl bg-blue-600 py-3 text-white font-medium active:scale-[0.99] disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </main>
  );
}
