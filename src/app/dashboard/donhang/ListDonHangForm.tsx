// src/app/dashboard/donhang/listdonhang.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";


import Link from 'next/link';
import Image from "next/image";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { LogOut } from "lucide-react";  // Thêm icon logout
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
    AnhNhan?: string;
    NguoiNhap?: {
        id: string;
        first_name?: string;
        email?: string;
    };
    // Add other fields as needed
};
type PhieuHang = {
    id: number;
    Donhangs: string; // Assuming it's a string like "[1,2,3]"
};
const STATUS_UI: Record<string, { label: string; cls: string }> = {
    TAO_MOI: { label: "Tạo mới", cls: "bg-zinc-50 text-zinc-700" },
    GHEP_DON: { label: "Chờ ghép đơn", cls: "bg-green-50 text-green-700" },
    LEN_DON: { label: "Đơn hàng mới tạo", cls: "bg-slate-50 text-slate-700" },
    CHO_LAY: { label: "Chờ vận chuyển đi giặt", cls: "bg-amber-50 text-amber-700" },
    VAN_CHUYEN: { label: "Vận chuyển đi giặt", cls: "bg-violet-50 text-violet-700" },
    DANG_GIAT: { label: "Đang giặt", cls: "bg-blue-50 text-blue-700" },
    GIAT_XONG: { label: "Giặt xong", cls: "bg-sky-50 text-sky-700" },
    CHO_VAN_CHUYEN_LAI: { label: "Chờ vận chuyển trả giày", cls: "bg-zinc-50 text-zinc-700" },
    VAN_CHUYEN_LAI: { label: "Vận chuyển trả giày", cls: "bg-zinc-50 text-zinc-700" },
    QUAY_NHAN_GIAY: { label: "Quầy nhận giày sạch", cls: "bg-zinc-50 text-zinc-700" },
    SAN_SANG: { label: "Sẵn sàng giao", cls: "bg-emerald-50 text-emerald-700" },
    HOAN_THANH: { label: "Đã hoàn thành", cls: "bg-emerald-50 text-emerald-700" },
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
    phieuhangs,
    token,
    sort,
    rolename,
    q,
    g,
    locationid,
    pageid,
    nameid,
}: {
    orders: DonHang[];
    phieuhangs: PhieuHang[];
    token: string;
    sort: string;
    rolename: string;
    q: string;
    g: string;
    locationid: string;
    pageid: number;
    nameid: string;
}) {
    const router = useRouter();
    //alert(JSON.stringify(phieuhangs));
    const [donHangList, setDonHangList] = useState(orders);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    type Picked = { id: number; trangThai?: string };
    const [page, setPage] = useState(pageid);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Picked[]>([]);
    const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";
    const isChecked = (id: number) => selectedItems.some(x => x.id === id);
    useEffect(() => {
        setSelectedItems([]);
    }, [donHangList]);
    // đồng bộ danh sách đơn theo props mới
    useEffect(() => {
        setDonHangList(orders);
    }, [orders]);

    // đồng bộ trang hiện hành theo props mới
    useEffect(() => {
        setPage(pageid);
    }, [pageid]);

    // đồng bộ bộ lọc trạng thái trong select theo query hiện tại
    useEffect(() => {
        setStatusFilter(g || "ALL");
    }, [g]);
    const assetUrl = (id: string, size = 96) =>
        `${ASSETS}/assets/${id}?width=${size}&height=${size}&fit=cover`;
    const fetchDonHang = async () => {
        setLoading(true);
        //const url = new URL(`/api/v1/donhang`);
        const url = new URLSearchParams();
        url.set("fields",
            "ID,TrangThai,GhiChu,ID_KhachHang.ID,ID_KhachHang.TenKhachHang,ID_KhachHang.DienThoai,NguoiNhap.first_name,NguoiNhap.email,AnhList.file.id,AnhFile.id,AnhNhan"
        );
        url.set("limit", String(limit));
        url.set("offset", String((page - 1) * limit));
        url.set("sort", sort);
        url.set("filter[TrangThai][_neq]", "TAO_MOI");
        if (["Giat", "Shipper"].includes(rolename)) {
            // Chỉ thấy CHO_LAY và DANG_GIAT
            url.set("filter[TrangThai][_in]", "CHO_LAY,DANG_GIAT,VAN_CHUYEN,GIAT_XONG,CHO_VAN_CHUYEN_LAI");
            url.set("filter[NhaGiat][_eq]", nameid);
        }
        if (["Shipper", "NhanVienQuay"].includes(rolename)) {
            // Chỉ thấy CHO_LAY và DANG_GIAT
            url.set("filter[ID_DiaDiem][_eq]", locationid);
        }
        // Tìm theo tên KH hoặc số điện thoại (deep filter qua quan hệ)
        if (q) {
            url.set("filter[_or][0][ID_KhachHang][TenKhachHang][_contains]", q);
            url.set("filter[_or][1][ID_KhachHang][DienThoai][_contains]", q);
        }
        if (g && g !== "ALL") {
            url.set("filter[TrangThai][_eq]", g);

        }

        const res = await fetch(`/api/v1/donhang?${url.toString()}`);

        if (res.ok) {
            const json = await res.json();

            setDonHangList(json?.data ?? []);
        } else {
            alert('Lỗi tải dữ liệu' + await res.text());
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
            if (["Administrator", "NhanVienQuay"].includes(rolename) && ["CHO_LAY", "LEN_DON", "QUAY_NHAN_GIAY", "VAN_CHUYEN_LAI"].includes(currentStatus)) {
                checkVisible = true;
            }
            if (["Administrator", "Giat"].includes(rolename) && ["DANG_GIAT", "VAN_CHUYEN", "CHO_VAN_CHUYEN_LAI"].includes(currentStatus)) {
                checkVisible = true;
            }
            if (["GIAT_XONG", "LEN_DON"].includes(currentStatus)) {
                return alert('Bạn phải quét QR để cập nhật ảnh ở trạng thái này');

            }
            if (!checkVisible) {
                return alert('Bạn không có quyền cập nhật trạng thái này');
            }

            /*
            const updates = selectedItems.map((item) => ({
                ID: item.id,
                TrangThai: next,
            }));
            //return alert(assetUrl);
            const res_donhang = fetch(`${ASSETS}/items/donhang`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });
            */
            const payloads = selectedItems.map(r => ({
                ID: r.id,
                TrangThai: next,              // <<<<<<<<< dùng trạng thái kế tiếp
            }));
            await Promise.all(
                payloads.map(body =>
                    fetch("/api/v1/capnhat", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    }).then(async (res) => {
                        if (!res.ok) {
                            const t = await res.text().catch(() => "");
                            throw new Error(`Cập nhật ID ${body.ID} lỗi: ${res.status} ${t}`);
                        }
                    })
                )
            );
            alert('Cập nhật trạng thái thành công!');
            await fetchDonHang(); // Refresh data
            //router.replace(`/dashboard/donhang?r=${Date.now()}`);

        } catch (error) {
            //console.error('Error updating status:', error);
            alert('Lỗi cập nhật trạng thái" ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    function getPhieuHang(current: number): React.ReactNode {
        if (!phieuhangs?.length) return null; // tránh suy luận kiểu string

        const currentStr = `,${current},`;

        for (const p of phieuhangs) {
            // chuẩn hóa chuỗi, bỏ dấu [ ], thêm dấu phẩy hai đầu để match chính xác
            const dhs =
                `,${String(p.Donhangs ?? "")
                    .replace(/\s/g, "")
                    .replace(/^\[|\]$/g, "")},`;

            if (dhs.includes(currentStr)) {
                return <a href={`#/phieuhang/${p.id}`}>#{p.id ?? ""}</a>;
            }
        }

        return null; // không khớp thì không render gì
    }




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
        if (q) sp.set("q", q);      // ← bật lại
        if (g) sp.set("g", g);      // ← thêm để giữ trạng thái lọc
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
        <main className="min-h-dvh bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur">
                <div className="mx-auto max-w-sm px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}

                        aria-label="Quay lại"
                        className="p-1 -ml-1 cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-[20px] font-semibold">Danh sách mặt hàng</h1>

                    {/* Nút Logout */}
                    <button
                        onClick={() => {
                            // Xử lý đăng xuất
                            alert("Đăng xuất thành công!");  // Cần làm backend để logout thực tế
                        }}
                        className="text-blue-600 hover:underline cursor-pointer ml-auto"
                    >
                        <LogOut size={18} className="inline-block text-gray-500" />
                    </button>
                </div>
            </div>



            {/* Bộ lọc */}
            <div className="mx-auto max-w-sm px-4">
                <form method="get" className="relative">
                    <Search className="absolute left-3 top-3.5" size={18} />
                    <input
                        name="q"
                        className="w-full rounded-2xl border border-gray-300 bg-white pl-10 pr-3 py-2.5 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tìm kiếm Tên hoặc SĐT khách hàng"
                    />
                    <div className="mt-3">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); e.currentTarget.form?.requestSubmit() }}
                                className="w-full appearance-none rounded-2xl border border-gray-300 bg-white px-3 py-2.5 pr-9 text-left text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                        </div>
                    </div>

                </form>

            </div>
            <div className="mx-auto max-w-sm px-4 mt-3">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                        checked={selectedItems.length === donHangList.length}
                        onChange={(e) => toggleAll(e.target.checked)}
                    />

                    <span className="text-[14px] text-gray-700">Chọn tất cả</span>
                </label>
            </div>
            {/* Danh sách */}
            <ul className="mx-auto max-w-sm p-4 space-y-3">
                {donHangList.map((r) => {
                    const id = r.ID;
                    const kh = r.ID_KhachHang || {};
                    const name = kh.TenKhachHang || "Khách lẻ";
                    const phone = kh.DienThoai || "";
                    const imgId = r?.AnhNhan ? r.AnhNhan : undefined;

                    const st = STATUS_UI[r.TrangThai || ""] || {
                        label: r.TrangThai || "",
                        cls: "bg-zinc-50 text-zinc-700",
                    };
                    /*
                              const tổng = Array.isArray(o.Items)
                                ? o.Items.reduce((s, it) => s + (it?.Tien || 0), 0)
                                : undefined;
                    */
                    return (
                        <li key={id} className="rounded-3xl bg-white border border-gray-100 shadow-sm">
                            {/* Header ID + badge */}
                            <div className="flex items-center justify-between px-4 pt-3">
                                {/* Trái: checkbox + ID */}
                                <label className="flex items-center gap-2 text-[13px] text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={isChecked(r.ID)}
                                        onChange={() => handleSelect(r.ID)}
                                        className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                                    />
                                    <Link
                                        href={`/dashboard/donhang/edit/${id}`}
                                        className="inline-flex items-center gap-1"
                                    >
                                        <span className="text-gray-500">ID:</span>
                                        <span
                                            className="
          inline-flex items-center rounded-full
          bg-blue-50 text-blue-700
          border border-blue-200
          px-2 py-0.5 text-[12px] font-semibold
          hover:bg-blue-100 transition-colors
        "
                                        >
                                            #{id}
                                        </span>
                                    </Link>
                                </label>

                                {/* Phải: trạng thái */}
                                <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                                    {st.label || "—"}
                                </span>
                            </div>

                            {/* Thân card: ảnh + thông tin KH (căn cùng hàng) */}
                            <div className="flex items-center gap-3 px-4 py-3">
                                <div className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                    {imgId && (
                                        <Image
                                            src={assetUrl(imgId, 176)}
                                            alt={name}
                                            fill
                                            sizes="88px"
                                            className="object-cover"
                                        />
                                    )}
                                </div>

                                {/* min-w-0 để text không đẩy vỡ layout, self-center nếu muốn cân giữa ảnh */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold leading-tight truncate">{name}</div>
                                    {phone && <div className="text-[13px] text-gray-600 mt-0.5">{phone}</div>}
                                    {/* nếu có địa chỉ: */}
                                    {/* <div className="text-[13px] text-gray-600 line-clamp-2">Địa chỉ…</div> */}
                                </div>
                            </div>



                        </li>
                    );
                })}
            </ul>

            {/* Nút hành động sticky */}
            <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur">
                <div className="mx-auto max-w-sm p-4">

                    <button onClick={handleUpdateStatus} className="w-full float-right rounded-2xl bg-blue-600 py-3 text-white font-medium disabled:opacity-60" >
                        Cập nhật trạng thái
                    </button>
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