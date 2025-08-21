"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditForm({
    id,
    trangThai,
    tenKhachHang,
    ghiChu,
    email,
    firstName,
    idKhachHang,
    dienThoai,
    diaChi,
    anhList_after,
    anhList,
    aCcess,
}: {
    id: number | string;
    trangThai: string;
    tenKhachHang?: string;
    ghiChu?: string;
    email?: string;
    firstName?: string;
    idKhachHang?: number | null;
    dienThoai?: string;
    diaChi?: string;
    anhList_after?: string[];
    anhList?: string[];
    aCcess?: string;
}) {
    const [ID, setID] = useState(id);
    const [DienThoai, setDienThoai] = useState(dienThoai || "");
    const [TenKhachHang, setTenKhachHang] = useState(tenKhachHang || "");
    const [DiaChi, setDiaChi] = useState(diaChi || "");
    const [GhiChu, setGhiChu] = useState(ghiChu||"");

    const [ID_KhachHang, setID_KhachHang] = useState<number | null>(null); // nếu tìm thấy
    //const [AnhFile, setAnhFile] = useState<string | null>(anhFile || null);
    //const [AnhList, setAnhList] = useState<string[]>(anhList || []);
    //const [AnhFiles, setAnhFiles] = useState<string[]>([]); // dùng
    const [AnhPreview, setAnhPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [finding, setFinding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const base = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS
        ?? process.env.NEXT_PUBLIC_DIRECTUS_URL
        ?? process.env.DIRECTUS_URL!;
    const [anhIds, setAnhIds] = useState<string[]>(anhList || []);
    const [previews, setPreviews] = useState<string[]>(
        (anhList || []).map(id => `${base}/assets/${id}`)
    );
    const [anhIds_after, setAnhIds_after] = useState<string[]>(anhList_after || []);
    const [previews_after, setPreviews_after] = useState<string[]>(
        (anhList_after || []).map(id => `${base}/assets/${id}`)
    );
    // const [previews, setPreviews] = useState<string[]>(anhList || []);

    const router = useRouter();
    async function onUploadMulti(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {

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

    function removeImg(i: number) {
        setAnhIds((arr) => arr.filter((_, idx) => idx !== i));
        setPreviews((arr) => arr.filter((_, idx) => idx !== i));
    }
    async function onUploadMulti_after(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {

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
            setAnhIds_after((old) => [...old, ...newIds]);
            setPreviews_after((old) => [...old, ...newPreviews]);
        } catch (e: any) { alert(e.message); }
        finally { setUploading(false); }
    }

    function removeImg_after(i: number) {
        setAnhIds_after((arr) => arr.filter((_, idx) => idx !== i));
        setPreviews_after((arr) => arr.filter((_, idx) => idx !== i));
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
            const body: any = { ID, GhiChu, AnhFiles: anhIds };

            if (ID_KhachHang) body.ID_KhachHang = ID_KhachHang;
            else {
                body.TenKhachHang = TenKhachHang.trim();
                body.DiaChi = DiaChi.trim();
                body.DienThoai = DienThoai.trim();
            }
            body.AnhList = anhIds;
            body.AnhList_After = anhIds_after;
            body.TrangThai = "Hoan_Thanh";
            const r = await fetch("/api/v1/donhang", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
                                        onClick={() => removeImg(i)}
                                        className="absolute -top-2 -right-2 bg-black/70 text-white text-xs rounded-full px-1">x</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm">Ảnh sau khi giặt</label>
                    <input type="file" accept="image/*" multiple className="mt-1" onChange={onUploadMulti_after} />
                    {uploading && <p className="text-sm text-gray-600">Đang tải ảnh…</p>}
                    {!!previews_after.length && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {previews_after.map((src, i) => (
                                <div key={i} className="relative">
                                    <img src={src} className="h-20 w-20 object-cover rounded border" />
                                    <button type="button"
                                        onClick={() => removeImg_after(i)}
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
