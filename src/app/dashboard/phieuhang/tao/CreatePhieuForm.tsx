"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { pick } from "zod/mini";

type Goi = { ID: number; TenGoi: string; GiaTien: number | string };
type Khach = { ID: number; TenKhachHang?: string; DienThoai?: string };
type Order = {
    ID: number;
    GhiChu?: string | null;
    GoiHangs?: unknown; // JSON: [1,4] hoặc string "[1,4]"
    ID_KhachHang?: Khach | null;
    ID_DiaDiem?:string|null;
};

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


    // Mặc định tick tất cả các đơn đang có
    const [picked, setPicked] = useState<number[]>(orders.map((o) => o.ID));
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

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
            setErr("Hãy chọn ít nhất một đơn để tạo phiếu.");
            return;
        }
        if (!firstCustomer?.ID) {
            setErr("Không xác định được khách hàng từ đơn đầu tiên.");
            return;
        }

        setSaving(true);
        try {
            const api = `/api/directus`;

            if (!api) throw new Error("Thiếu cấu hình DIRECTUS_URL / NEXT_PUBLIC_DIRECTUS_URL.");

            // Lưu phiếu vào bảng phieuhang
            const res = await fetch(`${api}/items/phieuhang`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ID_KhachHang: firstCustomer.ID, // khách theo đơn đầu tiên
                    Donhangs: picked,               // danh sách ID đơn
                    // Có thể thêm trường TongTien nếu bạn đã tạo trong DB:
                    TongTien: total,
                    TrangThai:"DANG_XU_LY",
                    ID_DiaDiem:orders[0]?.ID_DiaDiem||null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                const msg =
                    data?.errors?.[0]?.message ||
                    data?.error ||
                    "Không tạo được phiếu";
                throw new Error(msg);
            }
            const updates = picked.map((id) => ({ ID: id, TrangThai: "LEN_DON" })); // chú ý primary key là "ID"
            const res_donhang = await fetch(`${api}/items/donhang`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });
            if (!res_donhang.ok) {
                console.error('Bulk PATCH failed', res_donhang.status, await res_donhang.text());
            }
            alert(`Tạo phiếu #${data?.data?.ID ?? ""} thành công!`);
            router.replace(redirectTo);
        } catch (e: any) {
            setErr(e.message || "Có lỗi xảy ra.");
        } finally {
            setSaving(false);
        }
    }

    if (!orders.length) {
        return (
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">Tạo phiếu</h1>
                <p>Không có đơn hàng trạng thái <code>GHEP_DON</code>.</p>
            </main>
        );
    }

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tạo phiếu</h1>

            {/* Box khách hàng theo đơn đầu tiên */}
            {firstCustomer && (
                <section className="mb-6">
                    <div className="text-sm font-medium mb-2">
                        Khách hàng (theo đơn đầu tiên)
                    </div>
                    <div className="rounded border bg-gray-50 p-4">
                        <div className="text-base font-semibold">
                            {firstCustomer.TenKhachHang || "-"}
                        </div>
                        <div className="text-gray-600">
                            {firstCustomer.DienThoai || ""}
                        </div>
                    </div>
                </section>
            )}

            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">
                    Tất cả đơn hàng trạng thái <span className="font-mono">GHEP_DON</span>
                </div>
                <div className="text-sm">
                    <button
                        className="underline"
                        onClick={() => pickAll(true)}
                        type="button"
                    >
                        Chọn tất cả
                    </button>
                    <span className="mx-2">/</span>
                    <button
                        className="underline"
                        onClick={() => pickAll(false)}
                        type="button"
                    >
                        Bỏ chọn tất cả
                    </button>
                </div>
            </div>

            {/* Bảng đơn hàng */}
            <div className="overflow-x-auto rounded border bg-white">
                <table className="min-w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border text-left">Chọn</th>
                            <th className="p-2 border text-left">ID đơn</th>
                            <th className="p-2 border text-left">Khách</th>
                            <th className="p-2 border text-left">Ghi chú</th>
                            <th className="p-2 border text-left">Gói hàng</th>
                            <th className="p-2 border text-right">Tạm tính</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => {
                            const ids = toIdList(o.GoiHangs);
                            const sub = subtotal(o);

                            return (
                                <tr key={o.ID} className="border-t">
                                    <td className="p-2 border">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={picked.includes(o.ID)}
                                            onChange={() => togglePick(o.ID)}
                                        />
                                    </td>
                                    <td className="p-2 border font-mono">#{o.ID}</td>
                                    <td className="p-2 border">
                                        {(o.ID_KhachHang?.TenKhachHang || "-") +
                                            (o.ID_KhachHang?.DienThoai
                                                ? ` — ${o.ID_KhachHang.DienThoai}`
                                                : "")}
                                    </td>
                                    <td className="p-2 border">{o.GhiChu || "-"}</td>
                                    <td className="p-2 border">
                                        {ids.length
                                            ? ids.map((id) => labelById[id] ?? `#${id}`).join(", ")
                                            : "-"}
                                    </td>
                                    <td className="p-2 border text-right font-medium">
                                        {vnd(sub)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Tổng tiền */}
            <div className="mt-4 text-lg font-semibold">
                Tổng: <span className="text-green-700">{vnd(total)}</span>
            </div>

            {/* Thông báo lỗi nếu có */}
            {err && (
                <p className="mt-2 text-sm text-red-600">
                    {err}
                </p>
            )}

            {/* Nút hành động */}
            <div className="mt-6 flex gap-2">
                <button
                    type="button"
                    className="px-4 py-2 border rounded"
                    onClick={() => history.back()}
                    disabled={saving}
                >
                    Hủy
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={saving}
                    className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                >
                    {saving ? "Đang tạo..." : "Tạo phiếu"}
                </button>
            </div>
        </main>
    );
}
