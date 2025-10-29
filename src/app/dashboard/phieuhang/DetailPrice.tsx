'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from "react";

type Goi = { ID: number; TenGoi: string; GiaTien: number | string };
type row = {
    id: any,
    kh: { TenKhachHang: string, DienThoai: string },
    dd: { TenDiaDiem: string, DiaChi: string },
    imgs: string[],
    ids: number[],
    idsgh: number[],
    tong: number,
    tt: string,
    thanhtoan: any
};
export default function DetailPrice({
    r,
    goiHang,
}: {
    r: row,
    goiHang: Goi[];
}) {
    const ASSETS = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";
    const [detailsVisible, setDetailsVisible] = useState(false);
    const STATUS_LABEL: Record<string, string> = {
        DANG_XU_LY: "Đang xử lý",
        SAN_SANG: "Sẵn sàng",
        HOAN_THANH: "Đã hoàn thành",
    };
    const STATUS_BADGE: Record<string, string> = {
        DANG_XU_LY: "bg-green-50 text-green-700",
        SAN_SANG: "bg-emerald-50 text-emerald-700",
        HOAN_THANH: "bg-slate-100 text-slate-700",
    };
    const badge = STATUS_BADGE[r.tt] || "bg-slate-100 text-slate-700";
    function vnd(n: number) {
        return (n || 0).toLocaleString("vi-VN") + " đ";
    }
    const { priceById, labelById } = useMemo(() => {
        const p: Record<string, number> = {};
        const l: Record<string, string> = {};
        for (const g of goiHang) {
            const id = String(g.ID);
            const price = Number(g.GiaTien) || 0;
            p[id] = price;
            // l[id] = `${g.TenGoi} - ${vnd(price)}`;
            l[id] = `${g.TenGoi}`;
        }
        return { priceById: p, labelById: l };
    }, [goiHang]);

    const handleImageClick = () => {
        setDetailsVisible(prevState => !prevState);

        //sendSms();
    };
    const sendSms = async () => {
        const formData = new FormData();
        formData.append('Phone', '0941233669');
        formData.append('Text', 'test tin nhắn conwash');
        // Thêm các tham số khác nếu cần
        formData.append('Token', 'F65rWVYB3ohAkFzOzcong0YRYUTEJ6YoQMU'); // Ví dụ thêm key và value khác

        try {
            const response = await fetch('https://ecabinet.vn/api/mobile/ThongTinLich/sendSMSByPhoneNumb', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Response:', data);
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

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
    const money = (n: number) =>
        (n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VND";

    return (
        <>{/* Header ID + trạng thái */}
            <div className="flex items-center justify-between px-4 pt-3"   >
                <div className="text-[13px] text-gray-600 font-medium cursor-pointer" onClick={handleImageClick}>
                    ID đơn hàng: #{r.id}
                </div>
                <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${badge}`}>
                    {STATUS_LABEL[r.tt] ?? r.tt}
                </span>
            </div>

            {/* Thông tin KH + grid ảnh */}
            <div className="px-4 pt-2 pb-3">
                <div className="font-semibold">
                    {r.kh.TenKhachHang || "-"}{" "}
                    <span className="text-gray-400">•</span>{" "}
                    {r.kh.DienThoai || "-"}
                </div>

                {/* Grid ảnh + mã #id mỗi ảnh */}
                {r.imgs.length ? (
                    <div className="mt-2 border-dashed border-t pt-2">
                        <div className="grid grid-cols-4 gap-2">
                            {r.imgs.slice(0, 4).map((fid, idx) => (
                                <a
                                    key={idx}
                                    href={`#`}

                                    rel="noreferrer"
                                    className="block"

                                >
                                    <img
                                        src={`${ASSETS}/assets/${fid}?width=88&height=88&fit=cover`}
                                        className="h-20 w-20 rounded-md border object-cover"
                                        alt={`Ảnh đơn #${r.ids[idx] ?? ""}`}
                                    />
                                    <div className="text-[11px] text-gray-500 mt-1">
                                        #{r.ids[idx] ?? ""}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ) : null}

                {detailsVisible &&

                    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", fontSize: "16px", }}>
                        {toIdList(r.idsgh).map((innerArray, idx) => {
                            let item = innerArray.split(",").map((kk) => (
                                <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "5%", }}>
                                        <div style={{ height: "8px", width: "8px", position: "relative", borderRadius: "50%", backgroundColor: "#d9d9d9", }} />
                                        <div style={{ position: "relative", lineHeight: "24px", }}> #{r.ids[idx] ?? ""} {labelById[kk] ?? ``}</div>
                                    </div>
                                    <div style={{ position: "relative", lineHeight: "24px", fontWeight: "500", marginRight: "5%" }}>{money(priceById[kk] ?? 0)}</div>
                                </div>
                            ))
                            return (
                                <div style={{ width: "100%", }}>
                                    {item}
                                </div>



                            )
                        })}
                    </div>





                }

                {/* Tổng tiền */}
                <div className="mt-3 flex justify-between border-t pt-2">
                    <span className="text-[14px] text-gray-500">Tổng tiền</span>
                    <span className="font-bold">{r.tong.toLocaleString("vi-VN")} đ</span>
                </div>
            </div>

        </>
    );
}