"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { da } from "zod/locales";

type GoiHang = {
    ID: number;
    TenGoi: string;
    GiaTien: number;
    Type: number;
};
type Box_NhaGiat = {
    ID: number;
    NhaGiat: string;
    ID_DiaDiem: number;
    Type: number;
};
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
    anhNhan,
    anhList_after,
    anhList,
    goiHangIDs,
    me,
    roleName,
    locationId,
    locationName,
    listGoiHang,
    listNhaGiat,
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
    anhNhan?: string;
    anhList_after?: string[];
    anhList?: string[];
    goiHangIDs?: string[];
    me?: string;
    roleName: string;
    locationId?: string;
    locationName?: string;
    listGoiHang: GoiHang[];
    listNhaGiat: Box_NhaGiat[];
}) {
    const REQUIRED_ANH_NHAN = 1;
    const REQUIRED_ANH_TRUOC = 6;
    const REQUIRED_ANH_SAU = 6;
    const [goihangList, setgoihangList] = useState<GoiHang[]>(
        Array.isArray(listGoiHang) ? listGoiHang : []
    );

    const [errors, setErrors] = useState<{ anhNhan?: string; anhTruoc?: string; anhSau?: string; goiHangerr?: string; }>({});
    const [ID, setID] = useState(id);
    const [DienThoai, setDienThoai] = useState(dienThoai || "");
    const [TenKhachHang, setTenKhachHang] = useState(tenKhachHang || "");
    const [DiaChi, setDiaChi] = useState(diaChi || "");
    const [GhiChu, setGhiChu] = useState(ghiChu || "");
    const [TrangThai, setTrangThai] = useState(trangThai);
    const [Me, setMe] = useState(me);
    const [ID_KhachHang, setID_KhachHang] = useState<number | null>(null); // nếu tìm thấy
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


    const [uploading, setUploading] = useState(false);
    const [finding, setFinding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [suggestions, setSuggestions] = useState<{ ID: number, DienThoai: string, TenKhachHang: string, DiaChi: string }[]>([]);
    const [msg, setMsg] = useState<string | null>(null);
    type Picked = { id: number; loai?: number };

    const base = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS
        ?? process.env.NEXT_PUBLIC_DIRECTUS_URL
        ?? process.env.DIRECTUS_URL!;
    const [AnhId, setAnhId] = useState<string | null>(anhNhan || null);
    //const [AnhPreview, setAnhPreview] = useState<string | null>(`${base}/assets/${anhNhan}`);
    const [AnhPreview, setAnhPreview] = useState<string | null>(null);
    if (anhNhan && !AnhPreview) { setAnhPreview(`${base}/assets/${anhNhan}`); }
    const [anhIds, setAnhIds] = useState<string[]>(anhList || []);
    const [previews, setPreviews] = useState<string[]>(
        (anhList || []).map(id => `${base}/assets/${id}`)
    );
    const [anhIds_after, setAnhIds_after] = useState<string[]>(anhList_after || []);
    const [previews_after, setPreviews_after] = useState<string[]>(
        (anhList_after || []).map(id => `${base}/assets/${id}`)
    );
    //type GoiHang = { ID: string | number; TenGoi: string; GiaTien: number };
    //const [goiHang, setGoiHang] = useState<GoiHang[]>([]);
    //const [selectedGoiHangs, setSelectedGoiHangs] = useState<string[]>([]);
    const [selectedGoiHangs, setSelectedGoiHangs] = useState<Picked[]>([]);
    const isChecked = (id: number) => selectedGoiHangs.some(x => x.id === id);
    // const [previews, setPreviews] = useState<string[]>(anhList || []);
    const idx = Math.max(0, STATUS_ORDER.indexOf(trangThai));
    const router = useRouter();
    /*useEffect(() => {
        // Lấy dữ liệu các gói hàng từ API
        async function fetchGoiHang() {
            const response = await fetch('/api/v1/goihang', { method: "GET", headers: { "Content-Type": "application/json" } }); // Chỉnh lại endpoint API của bạn nếu cần
            const data = await response.json();
            setGoiHang(data?.gh || []);
        }

        fetchGoiHang();

        // Cập nhật lại danh sách các gói hàng đã chọn từ goiHangIDs
        setSelectedGoiHangs((goiHangIDs || []).map(String)); // Lưu ID gói hàng đã chọn vào selectedGoiHangs
    }, [goiHangIDs]);*/
    useEffect(() => {
        // Bảo vệ: nếu không có dữ liệu thì xóa chọn
        if (!Array.isArray(goiHangIDs) || goiHangIDs.length === 0) {
            setSelectedGoiHangs([]);
            return;
        }

        // Chuẩn hóa ID về number, loại bỏ giá trị không hợp lệ
        const ids = goiHangIDs
            .map(v => (typeof v === "number" ? v : parseInt(String(v), 10)))
            .filter(n => Number.isFinite(n));

        // Map sang Picked { id, loai } dựa theo goihangList để lấy Type
        const seen = new Set<number>();
        const picked: { id: number; loai?: number }[] = [];

        for (const id of ids) {
            if (seen.has(id)) continue;
            const row = goihangList.find(r => r.ID === id);
            if (row) {
                picked.push({ id, loai: row.Type });
                seen.add(id);
            }
        }

        setSelectedGoiHangs(picked);
    }, [goiHangIDs, goihangList]);
    const fetchSuggestions = async (query: string) => {
        if (query.trim() === "") return setSuggestions([]); // Không có gì để tìm

        const res = await fetch(`/api/v1/khachhang?phone=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data?.ok && data?.kh) {
            setSuggestions(data.kh); // Giả sử API trả về danh sách khách hàng có số điện thoại phù hợp
        } else {
            setSuggestions([]);
        }
        //alert(JSON.stringify(suggestions));
    };

    const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        setDienThoai(value);
        fetchSuggestions(value); // Gọi API khi người dùng gõ vào số điện thoại
    };
    const handleSuggestionSelect = (customer: any) => {
        setDienThoai(customer.DienThoai);
        setTenKhachHang(customer.TenKhachHang);
        setDiaChi(customer.DiaChi);
        setSuggestions([]); // Đóng gợi ý khi chọn
    };
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
    /*const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, id: string | number) => {
        // Thêm hoặc bỏ gói hàng khỏi danh sách đã chọn
        if (e.target.checked) {
            setSelectedGoiHangs(prev => [...prev, String(id)]);
        } else {
            setSelectedGoiHangs(prev => prev.filter(item => item !== String(id)));
        }
    };*/


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
            setAnhId(data.id);
            setAnhPreview(`${process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL}/assets/${data.id}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    }
    function removeImg_after(i: number) {
        setAnhIds_after((arr) => arr.filter((_, idx) => idx !== i));
        setPreviews_after((arr) => arr.filter((_, idx) => idx !== i));
    }
    /*
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
    async function sendZaloMessage() {
        const [userId, setUserId] = useState<string>('');
        const [message, setMessage] = useState<string>('');
        const [status, setStatus] = useState<string>('');
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, message }),
        });

        const data = await response.json();
        if (response.ok) {
            setStatus('Message sent successfully!');
        } else {
            setStatus(`Error: ${data.message}`);
        }
    }
*/
    function onSubmit(e: React.FormEvent) {
        e.preventDefault(); setSaving(true); setMsg(null);
        const nextErrors: typeof errors = {};

        const unique = new Set(selectedGoiHangs.map(x => x.loai || ''));
        if (unique.size !== 1) {
            nextErrors.goiHangerr = 'Các gói hàng được chọn phải cùng một loại.';
        }

        // bắt buộc đúng 1 ảnh khi nhận
        if (!AnhId) nextErrors.anhNhan = `Cần tải đủ ${REQUIRED_ANH_NHAN} ảnh khi nhận.`;

        // chỉ kiểm tra "Ảnh trước giặt" khi phần này đang hiển thị (idx > 1)
        if (idx > 1 && anhIds.length < REQUIRED_ANH_TRUOC) {
            nextErrors.anhTruoc = `Cần đủ ${REQUIRED_ANH_TRUOC} ảnh trước giặt (hiện có ${anhIds.length}).`;
        }
        if (idx > 5 && anhIds_after.length < REQUIRED_ANH_SAU) {
            nextErrors.anhSau = `Cần đủ ${REQUIRED_ANH_SAU} ảnh sau giặt (hiện có ${anhIds_after.length}).`;
        }
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            setSaving(false);
            return; // dừng lưu
        }
        try {
            const body: any = { ID, GhiChu, AnhFiles: anhIds };
            if (AnhId) body.Anh = AnhId;
            if (ID_KhachHang) body.ID_KhachHang = ID_KhachHang;
            else {
                body.TenKhachHang = TenKhachHang.trim();
                body.DiaChi = DiaChi.trim();
                body.DienThoai = DienThoai.trim();
            }
            body.AnhList = anhIds;
            body.AnhList_After = anhIds_after;
            body.TrangThai = TrangThai;

            if (idx == 0) {
                body.NguoiNhap = Me;
            }
            //body.GoiHangIDs = selectedGoiHangs; // Gửi mảng ID các gói hàng đã chọn
            let ghs = Array.from(
                new Set(selectedGoiHangs.map(x => x?.id).filter((v): v is number => typeof v === "number"))
            );

            body.GoiHangIDs = ghs;
            body.ID_DiaDiem = locationId; // Gửi location hiện tại
            let type_nhagiat = selectedGoiHangs[0].loai ? selectedGoiHangs[0].loai : 0;
            let ten_nhagiat = getNhaGiat(parseInt(body.ID_DiaDiem, 10), type_nhagiat)?.NhaGiat;
            body.NhaGiat = ten_nhagiat;
            // alert(ghs+"---"+getNhaGiat(parseInt(body.ID_DiaDiem, 10), type_nhagiat)?.NhaGiat);
            // return;
            //const r = await fetch("/api/v1/donhang", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            fetch("/api/v1/donhang", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            //const data = await r.json();
            //if (!r.ok || !data.ok) return alert("data " + data?.error || "Không tạo được đơn");
            if (idx == 0) {
                router.replace("/dashboard/phieuhang/tao");
            }
            else {

                router.replace("/dashboard/donhang");
            }

        } catch (e: any) {
            setMsg("catch " + e.message);
        } finally {
            setSaving(false);
        }
    }
    const handleCheckboxChange = (id: number) => {
        setSelectedGoiHangs(prev => {
            const exists = prev.find(x => x.id === id);
            if (exists) {
                // bỏ chọn
                return prev.filter(x => x.id !== id);
            }
            // thêm mới kèm trạng thái hiện tại lấy từ danh sách
            const row = goihangList.find(r => r.ID === id);
            return [...prev, { id, loai: row?.Type }];
        });
    };
    function getNhaGiat(id_diadiem: number, type: number) {
        return listNhaGiat.find(b => b.ID_DiaDiem === id_diadiem && b.Type === type);
    };
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-2xl font-bold">Nhập đơn hàng - {locationName}</h1>

            <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-xl">

                <div className="flex flex-col gap-2">
                    <label className="block text-sm">Số điện thoại</label>
                    <input
                        className="mt-1 w-full border rounded px-3 py-2"
                        value={DienThoai}
                        onChange={handlePhoneInputChange} // Gọi hàm khi người dùng gõ
                        placeholder="VD: 0987xxxxxx"
                        required
                    />

                    {/* Hiển thị các gợi ý nếu có */}
                    {suggestions.length > 0 && (
                        <ul className="mt-2 max-h-40 overflow-auto border rounded-lg shadow-lg">
                            {suggestions.map((customer, index) => (
                                <li
                                    key={index}
                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSuggestionSelect(customer)}
                                >
                                    {customer.DienThoai}
                                </li>
                            ))}
                        </ul>
                    )}
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

                <div className="block text-sm">
                    <div>
                        <label className="block text-sm">Ghi chú</label>
                        <input className="mt-1 w-full border rounded px-3 py-2" value={GhiChu} onChange={(e) => setGhiChu(e.target.value)} />
                    </div>

                </div>
                <div>
                    <label className="block text-sm">Ảnh khi nhận</label>
                    <input type="file" accept="image/*" className="mt-1" onChange={onUploadChange} />
                    {errors.anhNhan && <p className="text-sm text-red-600 mt-1">{errors.anhNhan}</p>}
                    {uploading && <p className="text-sm text-gray-600">Đang tải ảnh…</p>}
                    {AnhPreview && (
                        <div className="mt-2">
                            <img src={AnhPreview} alt="preview" className="h-24 rounded border" />

                        </div>
                    )}
                </div>
                {idx > 1 && (
                    <div>
                        <label className="block text-sm">Ảnh trước giặt</label>
                        <input type="file" accept="image/*" multiple className="mt-1" onChange={onUploadMulti} />
                        {errors.anhTruoc && <p className="text-sm text-red-600 mt-1">{errors.anhTruoc}</p>}
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

                )}



                {idx > 5 && (
                    <div>
                        <label className="block text-sm">Ảnh sau khi giặt</label>
                        <input type="file" accept="image/*" multiple className="mt-1" onChange={onUploadMulti_after} />
                        {errors.anhSau && <p className="text-sm text-red-600 mt-1">{errors.anhSau}</p>}
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

                )}
                <div>
                    <label className="block text-sm">Chọn Gói Hàng</label>
                    <div className="space-y-2">
                        {errors.goiHangerr && <p className="text-sm text-red-600 mt-1">{errors.goiHangerr}</p>}
                        {Array.isArray(goihangList) && goihangList.map((goi) => {
                            const disabled = idx >= 2;
                            return (
                                <div key={goi.ID} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`goi_${goi.ID}`}
                                        value={goi.ID}
                                        onChange={() => handleCheckboxChange(goi.ID)}
                                        disabled={disabled}
                                        checked={isChecked(goi.ID)}
                                        className="mr-2 "
                                    />
                                    <label htmlFor={`goi_${goi.ID}`} className="text-sm">{goi.TenGoi} - {goi.GiaTien} VND</label>
                                </div>
                            )
                        }
                        )
                        }
                    </div>
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
