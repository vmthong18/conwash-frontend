// src/app/dashboard/donhang/listdonhang.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

import Link from 'next/link';
import { redirect } from 'next/dist/server/api-utils';

type DonHang = {
    ID: number;
    ID_KhachHang?: {
        TenKhachHang?: string;
        DienThoai?: string;
    };
    TrangThai?: string;
    AnhFile?: {
        id: string;
    };
    NguoiNhap?: {
        id: string;
        first_name?: string;
        email?: string;
    };
    // Add other fields as needed
};
const STATUS_LABEL: Record<string, string> = {
    TAO_MOI: "Tạo mới",
    GHEP_DON: "Chờ ghép đơn ",
    LEN_DON: "Đơn hàng mới tạo",
    CHO_LAY: "Chờ vận chuyển đi giặt",
    VAN_CHUYEN: "Vận chuyển đi giặt",
    DANG_GIAT: "Đang giặt",
    GIAT_XONG: "Giặt xong",
    CHO_VAN_CHUYEN_LAI: "Chờ vận chuyển trả giày",
    VAN_CHUYEN_LAI: "Vận chuyển trả giày",
    QUAY_NHAN_GIAY: "Quầy nhận giày sạch",
    SAN_SANG: "Sẵn sàng giao",
    HOAN_THANH: "Đã hoàn thành",
};
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
export default function ListDonHang({
    orders,
    token,
    sort,
    rolename,
    q,
    g,
    locationid,
}: {
    orders: DonHang[];
    token: string;
    sort: string;
    rolename: string;
    q: string;
    g: string;
    locationid: string;
}) {
    const router = useRouter();
    const [donHangList, setDonHangList] = useState(orders);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    type Picked = { id: number; trangThai?: string };
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Picked[]>([]);
    const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";
    const isChecked = (id: number) => selectedItems.some(x => x.id === id);
    useEffect(() => {
        setSelectedItems([]);
    }, [donHangList]);
    const assetUrl = (id: string, size = 96) =>
        `${ASSETS}/assets/${id}?width=${size}&height=${size}&fit=cover`;
    const fetchDonHang = async () => {
        setLoading(true);
        const url = new URL(`${ASSETS}/items/donhang`);
        url.searchParams.set("fields",
            "ID,TrangThai,GhiChu,ID_KhachHang.ID,ID_KhachHang.TenKhachHang,ID_KhachHang.DienThoai,NguoiNhap.first_name,NguoiNhap.email,AnhList.file.id,AnhFile.id"
        );
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("offset", String((page - 1) * limit));
        url.searchParams.set("sort", sort);
        url.searchParams.set("filter[TrangThai][_neq]", "TAO_MOI");
        if (["Giat", "Shipper"].includes(rolename)) {
            // Chỉ thấy CHO_LAY và DANG_GIAT
            url.searchParams.set("filter[TrangThai][_in]", "CHO_LAY,DANG_GIAT,VAN_CHUYEN,GIAT_XONG");
        }
        if (["Shipper", "NhanVienQuay"].includes(rolename)) {
            // Chỉ thấy CHO_LAY và DANG_GIAT
            url.searchParams.set("filter[ID_DiaDiem][_eq]", locationid);
        }
        // Tìm theo tên KH hoặc số điện thoại (deep filter qua quan hệ)
        if (q) {
            url.searchParams.set("filter[_or][0][ID_KhachHang][TenKhachHang][_contains]", q);
            url.searchParams.set("filter[_or][1][ID_KhachHang][DienThoai][_contains]", q);
        }
        if (g && g !== "ALL") {
            url.searchParams.set("filter[TrangThai][_eq]", g);

        }

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        if (res.ok) {
            const json = await res.json();

            setDonHangList(json?.data ?? []);
        } else {
            alert('Lỗi tải dữ liệu');
        }
        setLoading(false);
    };
    function getNextStatus(current: string | undefined) {
        if (!current) return null;
        const idx = STATUS_ORDER.indexOf(current);
        if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
        return STATUS_ORDER[idx + 1];
    }
    async function handleUpdateStatus() {
        try {
            if (selectedItems.length === 0) {
                return alert('Chưa chọn đơn hàng!');
            }
            const unique = new Set(selectedItems.map(x => x.trangThai || ''));
            if (unique.size !== 1) {
                return alert('Các mặt hàng được chọn phải cùng một trạng thái hiện tại.');
            }
            const currentStatus = [...unique][0];
            const next = getNextStatus(currentStatus);
            if (!next) {
                return alert('Không thể cập nhật: đã ở trạng thái cuối hoặc trạng thái không hợp lệ.');
            }
            let checkVisible = false;
            if (["Administrator", "NhanVienQuay"].includes(rolename) && ["CHO_LAY", "LEN_DON", "QUAY_NHAN_GIAY", "SAN_SANG"].includes(currentStatus)) {
                checkVisible = true;
            }
            if (["Administrator", "Giat"].includes(rolename) && ["DANG_GIAT", "VAN_CHUYEN", "CHO_VAN_CHUYEN_LAI", "VAN_CHUYEN_LAI"].includes(currentStatus)) {
                checkVisible = true;
            }
            if (["GIAT_XONG", "LEN_DON"].includes(currentStatus)) {
                return alert('Bạn phải quét QR để cập nhật ảnh ở trạng thái này');

            }
            if (!checkVisible) {
                return alert('Bạn không có quyền cập nhật trạng thái này');
            }


            const updates = selectedItems.map((item) => ({
                ID: item.id,
                TrangThai: next,
            }));
            //return alert(assetUrl);
            const res_donhang = await fetch(`${ASSETS}/items/donhang`, {
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
            alert('Cập nhật trạng thái thành công!');
            fetchDonHang(); // Refresh data
            //router.replace(`/dashboard/donhang?r=${Date.now()}`);

        } catch (error) {
            //console.error('Error updating status:', error);
            alert('Lỗi cập nhật trạng thái" ' + (error instanceof Error ? error.message : String(error)));
        }
    };





    //const json = await res.json();

    // const json =  JSON.parse(orders);
    // const rows: any[] = json?.data ?? [];

    const hasPrev = page > 1;
    const hasNext = donHangList.length === limit;

    const paramsFor = (p: number) => {
        const sp = new URLSearchParams();
        sp.set("page", String(p));
        sp.set("limit", String(limit));
        sp.set("sort", sort);
        //if (q) sp.set("q", q);
        return `?${sp.toString()}`;
    };


    // Hàm chọn hoặc bỏ chọn tất cả các đơn hàng
    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(donHangList.map(r => ({ id: r.ID, trangThai: r.TrangThai })));
        } else {
            setSelectedItems([]);
        }
    };

    // Hàm chọn/deselect 1 đơn hàng
    const handleSelect = (id: number) => {
        setSelectedItems(prev => {
            const exists = prev.find(x => x.id === id);
            if (exists) {
                // bỏ chọn
                return prev.filter(x => x.id !== id);
            }
            // thêm mới kèm trạng thái hiện tại lấy từ danh sách
            const row = donHangList.find(r => r.ID === id);
            return [...prev, { id, trangThai: row?.TrangThai }];
        });
    };
    return (
        <main className="p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Mặt hàng </h1>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="text-blue-600 hover:underline">← Về Dashboard</Link>

                    <button onClick={handleUpdateStatus} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700" >
                        Cập nhật trạng thái
                    </button>
                </div>
            </div>

            {/* Thanh tìm kiếm */}
            <form method="get" className="mt-4 flex gap-2">
                <input
                    name="q"

                    placeholder="Nhập tên KH hoặc SĐT…"
                    className="border rounded px-3 py-2 w-72"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded px-3 py-2"
                    name="g"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
                <input type="hidden" name="limit" value={limit} />
                <input type="hidden" name="sort" value={sort} />
                <button className="px-4 py-2 bg-gray-800 text-white rounded">Tìm</button>
            </form>

            {/* Bảng */}
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border-b">
                                <input
                                    type="checkbox"
                                    onChange={(e) => toggleAll(e.target.checked)}
                                    checked={selectedItems.length === donHangList.length}
                                />
                            </th>
                            <Th label="ID" sort="ID" current={sort} />
                            <th className="text-left p-2 border-b">Tên khách hàng</th>
                            <th className="text-left p-2 border-b">Số điện thoại</th>

                            <th className="text-left p-2 border-b">Trạng thái</th>
                            <th className="text-left p-2 border-b">QR</th>
                         

                        </tr>
                    </thead>
                    <tbody>
                        {donHangList.map((r) => {
                            return (
                                <tr key={r.ID} className="border-b">
                                    <td className="p-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked(r.ID)}
                                            onChange={() => handleSelect(r.ID)}
                                        />
                                    </td>
                                    <td className="p-2">{r.ID}</td>
                                    <td className="p-2">{r?.ID_KhachHang?.TenKhachHang ?? "-"}</td>
                                    <td className="p-2">{r?.ID_KhachHang?.DienThoai ?? "-"}</td>

                                    <td className="p-2">
                                        {STATUS_LABEL[r?.TrangThai ?? ""]}
                                    </td>
                                    <td className="p-2">
                                        {r?.AnhFile?.id ? (
                                            <a
                                                href={`${ASSETS}/assets/${r.AnhFile.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Mở QR gốc"
                                            >
                                                <img
                                                    src={assetUrl(r.AnhFile.id, 64)}
                                                    alt="QR"
                                                    className="h-12 w-12 rounded border bg-white p-1 object-contain"
                                                />
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </td>

                                

                                </tr>
                            )
                        }
                        )}
                        {donHangList.length === 0 && (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            <div className="mt-4 flex items-center gap-3">
                <span>Trang {page}</span>
                <div className="flex gap-2">
                    {hasPrev ? (
                        <Link href={paramsFor(page - 1)} className="px-3 py-1 border rounded">← Trước</Link>
                    ) : <span className="px-3 py-1 border rounded opacity-50">← Trước</span>}
                    {hasNext ? (
                        <Link href={paramsFor(page + 1)} className="px-3 py-1 border rounded">Sau →</Link>
                    ) : <span className="px-3 py-1 border rounded opacity-50">Sau →</span>}
                </div>
            </div>
        </main>
    );
}
function Th({ label, sort, current }: { label: string; sort: string; current: string }) {
    const dir = current === sort ? "-" + sort : sort; // toggle
    const sp = new URLSearchParams();
    sp.set("page", "1");
    sp.set("limit", "10");
    sp.set("sort", dir);
    return (
        <th className="text-left p-2 border-b">
            <a href={`?${sp.toString()}`} className="hover:underline">{label}</a>
            {current === sort ? " ▲" : (current === "-" + sort ? " ▼" : "")}
        </th>
    );
}