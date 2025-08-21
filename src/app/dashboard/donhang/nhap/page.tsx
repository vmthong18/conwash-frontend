"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NhapDonHangPage() {
  const [DienThoai, setDienThoai] = useState("");
  const [TenKhachHang, setTenKhachHang] = useState("");
  const [DiaChi, setDiaChi] = useState("");
  const [GhiChu, setGhiChu] = useState("");
 
  const [ID_KhachHang, setID_KhachHang] = useState<number | null>(null); // nếu tìm thấy
  const [AnhFile, setAnhFile] = useState<string | null>(null);
  const [AnhPreview, setAnhPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [finding, setFinding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [anhIds, setAnhIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const router = useRouter();
  async function onUploadMulti(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const base = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS
        ?? process.env.NEXT_PUBLIC_DIRECTUS_URL
        ?? process.env.DIRECTUS_URL!;
      const newIds: string[] = [];
      const newPreviews: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data?.error || "Upload thất bại");
        newIds.push(data.id);
        newPreviews.push(`${base}/assets/${data.id}`);
      }
      setAnhIds((old) => [...old, ...newIds]);
      setPreviews((old) => [...old, ...newPreviews]);
    } catch (e: any) { alert(e.message); }
    finally { setUploading(false); }
  }
  async function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data?.error || "Upload thất bại");
      setAnhFile(data.id);
      const base = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.NEXT_PUBLIC_DIRECTUS_URL ?? process.env.DIRECTUS_URL!;
      setAnhPreview(`${base}/assets/${data.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }
  function removeImg(i: number) {
    setAnhIds((arr) => arr.filter((_, idx) => idx !== i));
    setPreviews((arr) => arr.filter((_, idx) => idx !== i));
  }
  async function onFind() {
    setMsg(null);
    const phone = DienThoai.trim();
    if (!phone) { setMsg("Nhập số điện thoại trước khi tìm"); return; }
    setFinding(true);
    try {
      const r = await fetch(`/api/v1/khachhang?phone=${encodeURIComponent(phone)}`);
      const data = await r.json();
      if (!data.ok) throw new Error(data?.error || "Lookup failed");
      if (data.found) {
        setID_KhachHang(data.kh.ID);
        setTenKhachHang(data.kh.TenKhachHang || "");
        setDiaChi(data.kh.DiaChi || "");
        setMsg(`Đã tìm thấy khách #${data.kh.ID}`);
      } else {
        setID_KhachHang(null);
        setMsg("Số điện thoại mới — sẽ thêm khách hàng mới khi lưu");
      }
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setFinding(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const body: any = { GhiChu,  AnhFiles: anhIds  };
      if (AnhFile) body.AnhFile = AnhFile;    // ⟵ dùng AnhFile (uuid)
      if (ID_KhachHang) body.ID_KhachHang = ID_KhachHang;
      else {
        body.TenKhachHang = TenKhachHang.trim();
        body.DiaChi = DiaChi.trim();
        body.DienThoai = DienThoai.trim();
      }
      const r = await fetch("/api/v1/donhang", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok || !data.ok) return alert(data?.error || "Không tạo được đơn");
      router.replace("/dashboard/donhang");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Nhập đơn hàng</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-xl">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm">Số điện thoại</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={DienThoai}
              onChange={(e) => setDienThoai(e.target.value)}
              placeholder="VD: 0987xxxxxx"
              required
            />
          </div>
          <button type="button" onClick={onFind}
            className="h-10 px-4 bg-gray-800 text-white rounded disabled:opacity-60"
            disabled={finding}
          >
            {finding ? "Đang tìm..." : "Tìm"}
          </button>
        </div>

        <div>
          <label className="block text-sm">Tên khách hàng</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={TenKhachHang}
            onChange={(e) => setTenKhachHang(e.target.value)}
            placeholder="Tự điền nếu đã tìm thấy theo SĐT"
            required={!ID_KhachHang} // bắt buộc khi KH chưa tồn tại
          />
        </div>

        <div>
          <label className="block text-sm">Địa chỉ</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={DiaChi}
            onChange={(e) => setDiaChi(e.target.value)}
            placeholder="Tự điền nếu đã tìm thấy theo SĐT"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Ghi chú</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={GhiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>

        </div>

        
        <div>
  <label className="block text-sm">Ảnh khi nhận</label>
  <input type="file" accept="image/*" multiple className="mt-1" onChange={onUploadMulti} />
  {uploading && <p className="text-sm text-gray-600">Đang tải ảnh…</p>}
  {!!previews.length && (
    <div className="mt-2 flex flex-wrap gap-2">
      {previews.map((src, i) => (
        <div key={i} className="relative">
          <img src={src} className="h-20 w-20 object-cover rounded border" />
          <button type="button"
            onClick={()=>removeImg(i)}
            className="absolute -top-2 -right-2 bg-black/70 text-white text-xs rounded-full px-1">x</button>
        </div>
      ))}
    </div>
  )}
</div>

        {msg && <p className={`text-sm mt-1 ${msg.startsWith("Đã tìm") ? "text-green-700" : "text-red-600"}`}>{msg}</p>}

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60" disabled={saving} type="submit">
            {saving ? "Đang lưu..." : "Lưu đơn hàng"}
          </button>
          <button className="px-4 py-2 border rounded" type="button" onClick={() => history.back()}>Hủy</button>
        </div>
      </form>
    </main>
  );
}
