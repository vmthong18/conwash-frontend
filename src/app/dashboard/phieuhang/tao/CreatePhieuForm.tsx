"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutBtn from "@/app/dashboard/LogoutBtn";
import RedirectBtn from "@/app/dashboard/RedirectBtn";
import { pick } from "zod/mini";


type Goi = { ID: number; TenGoi: string; GiaTien: number | string };
type Khach = { ID: number; TenKhachHang?: string; DienThoai?: string };
type Order = {
    ID: number;
    GhiChu?: string | null;
    GoiHangs?: unknown; // JSON: [1,4] hoặc string "[1,4]"
    ID_KhachHang?: Khach | null;
    ID_DiaDiem?: string | null;
    AnhNhan?: string | null;
};
const STATUS = { GHEP_DON: { label: "Chờ ghép đơn", cls: "bg-green-50 text-green-700" } };
function vnd(n: number) {
    return (n || 0).toLocaleString("vi-VN") + " đ";
}

/** Parse cột JSON GoiHangs thành mảng ID dạng string an toàn */
function toIdList(val: unknown): string[] {
    try {
        if (Array.isArray(val)) {
            return val.map((x: any) => String(typeof x === "object" ? x?.ID ?? x : x));
        }
        if (typeof val === "string" && val.trim().startsWith("[")) {
            const arr = JSON.parse(val);
            return Array.isArray(arr) ? arr.map((x: any) => String(x?.ID ?? x)) : [];
        }
    } catch (_) { }
    return [];
}

export default function CreatePhieuForm({
    orders,
    goiHang,
    token,
    redirectTo = "/dashboard/phieuhang",
}: {
    orders: Order[];
    goiHang: Goi[];
    token: string;
    /** Sau khi tạo phiếu xong sẽ chuyển đến đây */
    redirectTo?: string;
}) {
    const router = useRouter();
    //const [tongtien,setTongTien] = useState<number>();
    // Bảng giá: { "1": 50000, "4": 950000, ... }
    // Bảng giá + nhãn hiển thị cho từng gói: "TenGoi - 50.000 đ"
    const { priceById, labelById } = useMemo(() => {
        const p: Record<string, number> = {};
        const l: Record<string, string> = {};
        for (const g of goiHang) {
            const id = String(g.ID);
            const price = Number(g.GiaTien) || 0;
            p[id] = price;
            l[id] = `${g.TenGoi} - ${vnd(price)}`;
        }
        return { priceById: p, labelById: l };
    }, [goiHang]);
    //alert(JSON.stringify(orders));

    // Mặc định tick tất cả các đơn đang có
    const [picked, setPicked] = useState<number[]>(orders.map((o) => o.ID));
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [paid, setPaid] = useState(false); // ✅ đã thanh toán?


    // Tạm tính từng đơn = tổng tiền các gói trong cột GoiHangs
    const subtotal = (o: Order): number => {
        const ids = toIdList(o.GoiHangs);
        return ids.reduce((s, id) => s + (priceById[id] ?? 0), 0);
    };


    // Tổng theo những đơn đang tick
    const total = useMemo(
        () => picked.reduce((s, id) => s + subtotal(orders.find((o) => o.ID === id)!), 0),
        [picked, orders, priceById]
    );

    const togglePick = (id: number) =>
        setPicked((lst) => (lst.includes(id) ? lst.filter((x) => x !== id) : [...lst, id]));
    const pickAll = (checked: boolean) =>
        setPicked(checked ? orders.map((o) => o.ID) : []);

    const firstCustomer = orders[0]?.ID_KhachHang ?? null;

    async function onSubmit() {
        setErr(null);
        if (!picked.length) {
            setErr("Hãy chọn ít nhất một đơn để tạo đơn.");
            return;
        }
        if (!firstCustomer?.ID) {
            setErr("Không xác định được khách hàng từ mặt hàng đầu tiên.");
            return;
        }

        setSaving(true);
        try {
            const api = `/api/directus`;

            if (!api) throw new Error("Thiếu cấu hình DIRECTUS_URL / NEXT_PUBLIC_DIRECTUS_URL.");

            // Lưu phiếu vào bảng phieuhang
            const res = await fetch(`/api/v1/phieuhang`, {
                method: "POST",
                body: JSON.stringify({
                    ID_KhachHang: firstCustomer.ID, // khách theo đơn đầu tiên
                    Donhangs: picked,               // danh sách ID đơn
                    // Có thể thêm trường TongTien nếu bạn đã tạo trong DB:
                    TongTien: total,
                    TrangThai: "DANG_XU_LY",
                    ID_DiaDiem: orders[0]?.ID_DiaDiem || null,
                    ThanhToan: (paid ? 1 : 0),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                const msg =
                    data?.errors?.[0]?.message ||
                    data?.error ||
                    "Không tạo được đơn";
                throw new Error(msg);
            }
            const updates = picked.map((id) => ({ ID: id, TrangThai: "LEN_DON" })); // chú ý primary key là "ID"
            const res_donhang = await fetch(`/api/v1/donhang`, {
                method: "PATCH",
                body: JSON.stringify(updates),
            });
            if (!res_donhang.ok) {
                alert(await res_donhang.text());
                //console.error('Bulk PATCH failed', res_donhang.status, await res_donhang.text());
            }
            alert(`Tạo đơn #${data?.data?.ID ?? ""} thành công!`);
            //router.replace(redirectTo);
            router.replace(`${redirectTo}?r=${Date.now()}`);
        } catch (e: any) {
            setErr(e.message || "Có lỗi xảy ra.");
        } finally {
            setSaving(false);
        }
    }

    if (!orders.length) {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">Tạo đơn</h1>
                <p>Không có đơn hàng trạng thái <code>GHEP_DON</code>.</p>
            </main>
        );
    }
    const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";
    const assetUrl = (id: string, size = 96) =>
        `${ASSETS}/assets/${id}?width=${size}&height=${size}&fit=cover`;
    const money = (n: number) =>
        (n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VND";
    return (
        <main className="min-h-dvh bg-gray-50">


            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur">
                <div className="mx-auto max-w-sm px-4 py-3 flex items-center gap-3">
                    <RedirectBtn page="/dashboard/phieuhang" />
                    <h1 className="text-[20px] font-semibold">Tạo đơn hàng</h1>

                    <LogoutBtn />
                </div>
            </div>

            {/* Danh sách card */}
            <ul className="mx-auto max-w-sm p-4 space-y-3">
                {orders.map((o) => {
                    const kh = o.ID_KhachHang || ({} as Khach);
                    const sub = subtotal(o);
                    const ids = toIdList(o.GoiHangs);

                    const checked = picked.includes(o.ID);
                    return (
                        <li key={o.ID} className="rounded-3xl bg-white border border-gray-200 shadow-sm">
                            {/* Hàng checkbox + ID + badge */}
                            <div className="flex items-center justify-between px-4 pt-3">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="size-4 rounded border-gray-300"
                                        checked={picked.includes(o.ID)}
                                        onChange={() => togglePick(o.ID)}
                                    />
                                    <span className="text-[13px] text-gray-700 font-medium">ID: #{o.ID}</span>
                                </label>
                                <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${STATUS.GHEP_DON.cls}`}>
                                    {STATUS.GHEP_DON.label}
                                </span>
                            </div>

                            {/* Ảnh + thông tin KH (nếu có ảnh thì thay phần img) */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                {o.AnhNhan && (
                                    <img src={assetUrl(o.AnhNhan, 176)} className="h-20 w-20 rounded-xl object-cover border bg-gray-100" />
                                )}
                                {/* <img src={...} className="h-20 w-20 rounded-xl object-cover border bg-gray-100" /> */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold leading-tight">{kh?.TenKhachHang || "Khách lẻ"}</div>
                                    {kh?.DienThoai && (
                                        <div className="text-[13px] text-gray-600 mt-0.5">{kh.DienThoai}</div>
                                    )}
                                    {/* có địa chỉ thì render 1 dòng nữa */}
                                </div>
                            </div>

                            {/* Dịch vụ + Tổng tiền */}
                            <div className="px-4 pb-3">
                                <ul className="text-[14px] text-gray-700 space-y-1.5">
                                    {toIdList(o.GoiHangs).map((id) => (
                                        <li key={id} className="flex justify-between">
                                            <span className="flex items-center gap-2">
                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                {labelById[id] ?? `Gói #${id}`}
                                            </span>
                                            <span className="font-semibold">{money(priceById[id] ?? 0)}</span>
                                        </li>
                                    ))}

                                </ul>
                                <div className="mt-2 flex justify-between border-t pt-2">
                                    <span className="text-[14px] text-gray-500">Tổng tiền</span>
                                    <span className="font-bold">{money(sub)}</span>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {/* ✅ Checkbox Đã thanh toán */}
            <label className="inline-flex items-center gap-2 whitespace-nowrap">
                <input
                    type="checkbox"
                    className="size-4 rounded border-gray-300"
                    checked={paid}
                    onChange={(e) => setPaid(e.target.checked)}
                />
                <span className="text-[14px] text-gray-700">Đã thanh toán</span>
            </label>

            {/* Thanh đáy sticky: tổng + nút tạo đơn */}
            <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur">
                <div className="mx-auto max-w-sm p-4 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[13px] text-gray-500">Tổng tiền</div>
                        <div className="text-[18px] font-bold">{money(total)}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!picked.length || saving}
                        className="rounded-2xl bg-blue-600 px-6 py-3 text-white font-medium disabled:opacity-60"
                    >
                        {saving ? "Đang tạo..." : "Tạo đơn"}
                    </button>
                </div>
            </div>


            {/* Thông báo lỗi */}
            {err && <p className="mx-auto max-w-sm px-4 pb-4 text-sm text-red-600">{err}</p>}






        </main>
    );
}
