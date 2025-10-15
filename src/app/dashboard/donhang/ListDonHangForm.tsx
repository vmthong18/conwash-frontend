// src/app/dashboard/donhang/listdonhang.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

import Link from 'next/link';
import Image from "next/image";
import { Search, ChevronRight } from "lucide-react";
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
    AnhNhan?: {
        id: string;
    };
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
  CHO_LAY: { label: "Chờ lấy", cls: "bg-amber-50 text-amber-700" },
  VAN_CHUYEN: { label: "Vận chuyển", cls: "bg-violet-50 text-violet-700" },
  DANG_GIAT: { label: "Đang giặt", cls: "bg-blue-50 text-blue-700" },
  GIAT_XONG: { label: "Giặt xong", cls: "bg-sky-50 text-sky-700" },
  CHO_VAN_CHUYEN_LAI: { label: "Chờ chuyển lại", cls: "bg-zinc-50 text-zinc-700" },
  VAN_CHUYEN_LAI: { label: "Vận chuyển lại", cls: "bg-zinc-50 text-zinc-700" },
  QUAY_NHAN_GIAY: { label: "Quầy nhận giày", cls: "bg-zinc-50 text-zinc-700" },
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
            url.searchParams.set("filter[TrangThai][_in]", "CHO_LAY,DANG_GIAT,VAN_CHUYEN,GIAT_XONG,CHO_VAN_CHUYEN_LAI");
            url.searchParams.set("filter[NhaGiat][_eq]", nameid);
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
        <div className="mx-auto max-w-sm px-4 py-3">
          <h1 className="text-[20px] font-semibold">Danh sách mặt hàng</h1>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="mx-auto max-w-sm px-4">
        <form  method="get" className="relative">
          <Search className="absolute left-3 top-3.5" size={18} />
          <input
            name="q"
            className="w-full rounded-2xl border border-gray-300 bg-white pl-10 pr-3 py-2.5 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm kiếm Tên hoặc SĐT khách hàng"
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

        
      </div>

      {/* Danh sách */}
      <ul className="mx-auto max-w-sm p-4 space-y-3">
        {donHangList.map((r) => {
          const id = r.ID;
          const kh = r.ID_KhachHang || {};
          const name = kh.TenKhachHang || "Khách lẻ";
          const phone = kh.DienThoai || "";
          const imgId =
            r?.AnhNhan?.id 
            undefined;

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
                 
                <div className="text-[13px] text-gray-600 font-medium">ID: #{id}</div>
                <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                   {st.label || "—"}
                </span>
              </div>

              {/* Thân card: ảnh + info */}
              <div className="grid grid-cols-[88px,1fr] gap-3 px-4 py-3">
                <div className="relative w-[88px] h-[88px] rounded-xl overflow-hidden bg-gray-100">
                  {imgId ? (
                    <Image
                      src={assetUrl(imgId, 176)}
                      alt={name}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <div className="font-semibold leading-tight">{name}</div>
                  {phone && (
                    <div className="text-[13px] text-gray-600 mt-0.5">{phone}</div>
                  )}
                  {/* Nếu anh có địa chỉ, thêm 1 dòng như ảnh Figma */}
                </div>
              </div>

             

              {/* Checkbox chọn */}
              <div className="px-4 pb-3 flex items-center gap-2">
                 <input
                                            type="checkbox"
                                            checked={isChecked(r.ID)}
                                            onChange={() => handleSelect(r.ID)}
                                        />
                <span className="text-[14px] text-gray-700">Chọn đơn này</span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Nút hành động sticky */}
      <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-sm p-4">
        
              <button onClick={handleUpdateStatus} className="w-full rounded-2xl bg-blue-600 py-3 text-white font-medium disabled:opacity-60" >
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