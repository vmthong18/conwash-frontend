// src/app/dashboard/diadiem/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutBtn from "../LogoutBtn";
import { directusFetch } from "@/lib/directusFetch";
import Image from "next/image";

// Kiểu dữ liệu gọn gàng
type DiaDiem = { ID: number; TenDiaDiem: string };
type Mapping_NhaGiat = { ID: number; NhaGiat: string; ID_DiaDiem: number; Type: number; };
type NhaGiat = { id: string; first_name: string; last_name: string; title: string };
type CountRow = {
    ID_DiaDiem: number | null;
    count: { "*": number } | number; // tuỳ phiên bản Directus
};

export default async function PageDiaDiem() {
    const jar = await cookies();
    const access =
        jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value || "";

    if (!access) {
        return <main className="p-8">Chưa đăng nhập.</main>;
    }

    const API = process.env.DIRECTUS_URL!;

    // 1) Lấy danh sách địa điểm đang hoạt động
    const ddUrl = new URL(`${API}/items/diadiem`);
    ddUrl.searchParams.set("fields", "ID,TenDiaDiem");
    ddUrl.searchParams.set("filter[TrangThai][_eq]", "HoatDong");
    ddUrl.searchParams.set("sort", "TenDiaDiem");
    ddUrl.searchParams.set("limit", "-1");

    const ddRes = await directusFetch(ddUrl.toString(), {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
    });

    if (!ddRes.ok) {
        const t = await ddRes.text().catch(() => "");
        return (
            <main className="p-8">
                <h1 className="text-2xl font-bold">Địa điểm</h1>
                <p className="text-red-600 mt-4">
                    Lỗi tải địa điểm: {ddRes.status} {t}
                </p>
            </main>
        );
    }

    const ddJson = await ddRes.json();
    const diaDiems: DiaDiem[] = ddJson?.data ?? [];

    // 2) Lấy danh sách mapping địa điểm- nhà giặt
    const ddng = new URL(`${API}/items/mapping_nhagiat`);
    ddng.searchParams.set("sort", "ID_DiaDiem");
    ddng.searchParams.set("limit", "-1");

    const ddngRes = await directusFetch(ddng.toString(), {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
    });

    if (!ddngRes.ok) {
        const t = await ddngRes.text().catch(() => "");
        return (
            <main className="p-8">
                <h1 className="text-2xl font-bold"></h1>
                <p className="text-red-600 mt-4">
                    Lỗi tải Mapping nhà giặt: {ddngRes.status} {t}
                </p>
            </main>
        );
    }

    const ddngJson = await ddngRes.json();
    const mng: Mapping_NhaGiat[] = ddngJson?.data ?? [];

    // 3) Lấy danh sách nhà giặt
    const nglst = new URL(`${API}/users`);
    nglst.searchParams.set("filter[title][_null]", "false");

    const ngRes = await directusFetch(nglst.toString(), {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
    });

    if (!ngRes.ok) {
        const t = await ngRes.text().catch(() => "");
        return (
            <main className="p-8">
                <h1 className="text-2xl font-bold"></h1>
                <p className="text-red-600 mt-4">
                    Lỗi tải nhà giặt: {ngRes.status} {t}
                </p>
            </main>
        );
    }

    const ngJson = await ngRes.json();
    const ng: NhaGiat[] = ngJson?.data ?? [];


    // 4) Lấy danh sách mapping nhà giặt - địa điểm-
    const ngdd = new URL(`${API}/items/mapping_nhagiat`);
    ngdd.searchParams.set("sort", "NhaGiat");
    ngdd.searchParams.set("limit", "-1");

    const ngddRes = await directusFetch(ngdd.toString(), {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
    });

    if (!ngddRes.ok) {
        const t = await ngddRes.text().catch(() => "");
        return (
            <main className="p-8">
                <h1 className="text-2xl font-bold"></h1>
                <p className="text-red-600 mt-4">
                    Lỗi tải Mapping nhà giặt: {ngddRes.status} {t}
                </p>
            </main>
        );
    }

    const ngddJson = await ngddRes.json();
    const mngdd: Mapping_NhaGiat[] = ngddJson?.data ?? [];
    /*
        const aggUrl_gx = new URL(`${API}/items/donhang`);
        aggUrl_gx.searchParams.set("aggregate[count]", "*");
        aggUrl_gx.searchParams.set("groupBy", "ID_DiaDiem");
        aggUrl_gx.searchParams.set("filter[TrangThai][_eq]", "CHO_VAN_CHUYEN_LAI");
    
        // 2) Dùng aggregate + groupBy để đếm số đơn "CHO_LAY" theo ID_DiaDiem
        //    (Directus v11 hỗ trợ /items/<collection>?aggregate[count]=*&groupBy=<field>)
        const aggUrl = new URL(`${API}/items/donhang`);
        aggUrl.searchParams.set("aggregate[count]", "*");
        aggUrl.searchParams.set("groupBy", "ID_DiaDiem");
        aggUrl.searchParams.set("filter[TrangThai][_eq]", "CHO_LAY");
        // Nếu muốn chỉ đếm các đơn thuộc các địa điểm hiện có:
        // aggUrl.searchParams.set("filter[ID_DiaDiem][_in]", diaDiems.map(d=>d.ID).join(","));
    
    
    
        const aggRes = await fetch(aggUrl.toString(), {
            headers: { Authorization: `Bearer ${access}` },
            cache: "no-store",
        });
        const aggRes_gx = await fetch(aggUrl_gx.toString(), {
            headers: { Authorization: `Bearer ${access}` },
            cache: "no-store",
        });
        let countsByLocation = new Map<number, number>();
        let countsByLocation_gx = new Map<number, number>();
        if (aggRes_gx.ok) {
            const aggJson_gx = await aggRes_gx.json();
            const rows: CountRow[] = aggJson_gx?.data ?? [];
            for (const r of rows) {
                if (r.ID_DiaDiem == null) continue;
                const value_gx =
                    typeof r.count === "number" ? r.count : (r.count?.["*"] ?? 0);
    
                countsByLocation_gx.set(Number(r.ID_DiaDiem), Number(value_gx));
            }
        }
        if (aggRes.ok) {
            const aggJson = await aggRes.json();
            const rows: CountRow[] = aggJson?.data ?? [];
            for (const r of rows) {
                if (r.ID_DiaDiem == null) continue;
                const value =
                    typeof r.count === "number" ? r.count : (r.count?.["*"] ?? 0);
                countsByLocation.set(Number(r.ID_DiaDiem), Number(value));
    
            }
        } else {
            // Fallback: nếu aggregate không dùng được, đếm từng địa điểm (ít địa điểm thì vẫn ổn)
            await Promise.all(
                diaDiems.map(async (d) => {
                    const cUrl = new URL(`${API}/items/donhang`);
                    cUrl.searchParams.set("aggregate[count]", "*");
                    cUrl.searchParams.set("filter[TrangThai][_eq]", "CHO_LAY");
                    cUrl.searchParams.set("filter[ID_DiaDiem][_eq]", String(d.ID));
                    const r = await fetch(cUrl.toString(), {
                        headers: { Authorization: `Bearer ${access}` },
                        cache: "no-store",
                    });
                    if (r.ok) {
                        const j = await r.json();
                        const row = (j?.data ?? [])[0];
                        const v =
                            typeof row?.count === "number"
                                ? row.count
                                : row?.count?.["*"] ?? 0;
                        countsByLocation.set(d.ID, Number(v || 0));
                    } else {
                        countsByLocation.set(d.ID, 0);
                    }
    
                    const cUrl_gx = new URL(`${API}/items/donhang`);
                    cUrl_gx.searchParams.set("aggregate[count]", "*");
                    cUrl_gx.searchParams.set("filter[TrangThai][_eq]", "CHO_VAN_CHUYEN_LAI");
                    cUrl_gx.searchParams.set("filter[ID_DiaDiem][_eq]", String(d.ID));
                    const r_gx = await fetch(cUrl_gx.toString(), {
                        headers: { Authorization: `Bearer ${access}` },
                        cache: "no-store",
                    });
                    if (r_gx.ok) {
                        const j_gx = await r_gx.json();
                        const row_gx = (j_gx?.data ?? [])[0];
                        const v_gx =
                            typeof row_gx?.count === "number"
                                ? row_gx.count
                                : row_gx?.count?.["*"] ?? 0;
                        countsByLocation_gx.set(d.ID, Number(v_gx || 0));
                    } else {
                        countsByLocation_gx.set(d.ID, 0);
                    }
                })
            );
        }
            */
    async function getResult(trangthai: string, diadiem: number, nhagiat: string) {
        const cUrl_gx = new URL(`${API}/items/donhang`);
        cUrl_gx.searchParams.set("aggregate[count]", "*");
        cUrl_gx.searchParams.set("filter[TrangThai][_in]", trangthai);
        cUrl_gx.searchParams.set("filter[ID_DiaDiem][_eq]", String(diadiem));
        cUrl_gx.searchParams.set("filter[NhaGiat][_eq]", nhagiat);
        const r_gx = await directusFetch(cUrl_gx.toString(), {
            headers: { Authorization: `Bearer ${access}` },
            cache: "no-store",
        });
        if (r_gx.ok) {
            const j_gx = await r_gx.json();
            const row_gx = (j_gx?.data ?? [])[0];
            const v_gx =
                typeof row_gx?.count === "number"
                    ? row_gx.count
                    : row_gx?.count?.["*"] ?? 0;

            return Number(v_gx || 0);
        } else {
            return 0;
        }
    }
    function getNhaGiat(id: string) {
        return ng.find(b => b.id === id)?.first_name;
    };
    function getDiaDiem(id: number) {
        return diaDiems.find(b => b.ID === id)?.TenDiaDiem;
    };
    {
        return (
            <main className="p-6">
                <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur">
                    <div className="mx-auto max-w-sm px-4 py-3 flex items-center gap-3">

                        <h1 className="text-[20px] font-semibold">Danh sách vận chuyển</h1>

                        <LogoutBtn />
                    </div>
                </div>
                <ul className="mx-auto max-w-sm p-4 space-y-3">
                    {mng.map((d) => {

                        return (
                            <li key={d.ID} className="rounded-2xl bg-white border border-gray-200 shadow-sm">
                                <div style={{ width: "100%", position: "relative", borderRadius: "12px", backgroundColor: "#e7eefc", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", fontSize: "14px", color: "#141414", fontFamily: "Roboto", }}>
                                    <div style={{ alignSelf: "stretch", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start", }}>

                                        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", }}>
                                            <Image src="/Ellipse 2.svg" style={{ alignSelf: "stretch", height: "1px", position: "relative", maxWidth: "100%", overflow: "hidden", flexShrink: "0", width: "100%", }} width={343} height={1} sizes="100vw" alt="" />
                                        </div>
                                        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px", gap: "8px", fontSize: "16px", color: "#7a7c80", }}>
                                            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", color: "#141414", }}>
                                                {/* Cụm 2 dòng: Box Thảo Điền & Giặt giày vải */}
                                                <div className="flex items-start gap-2">
                                                    {/* Cột trái: chấm – line – chấm */}
                                                    <div className="flex flex-col items-center py-1">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                                                        <span className="w-px flex-1 bg-gray-300/70 my-1" />
                                                        <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                                                    </div>

                                                    {/* Cột phải: nội dung 2 dòng */}
                                                    <div className="flex-1">
                                                        <div className="mb-3">
                                                            <div className="font-semibold text-[15px] leading-5">Box Thảo Điền</div>
                                                            <div className="text-sm text-gray-600 leading-5">
                                                                10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="font-semibold text-[15px] leading-5">Giặt giày vải</div>
                                                            <div className="text-sm text-gray-600 leading-5">
                                                                10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>


                                            </div>
                                            <div style={{ alignSelf: "stretch", height: "1px", position: "relative", borderTop: "1px dashed #c4c6cc", boxSizing: "border-box", }} />
                                            <div style={{ display: "flex", alignItems: "center", }}>
                                                <div style={{ width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0", }}>{`Đơn hàng chờ giao: `}</div>
                                                <div style={{ borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter", }}>
                                                    <div style={{ position: "relative", lineHeight: "20px", fontWeight: "500", }}>{getResult("CHO_LAY", d.ID_DiaDiem, d.NhaGiat)} đơn</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", }}>
                                                <div style={{ width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0", }}>{`Đơn hàng đang giao: `}</div>
                                                <div style={{ borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter", }}>
                                                    <div style={{ position: "relative", lineHeight: "20px", fontWeight: "500", }}>{getResult("VAN_CHUYEN", d.ID_DiaDiem, d.NhaGiat)} đơn</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </li>
                        );
                    })}
                    {mngdd.map((d) => {

                        return (
                            <li key={d.ID} className="rounded-2xl bg-white border border-gray-200 shadow-sm">
                                <div style={{ width: "100%", position: "relative", borderRadius: "12px", backgroundColor: "#e7eefc", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", fontSize: "14px", color: "#141414", fontFamily: "Roboto", }}>
                                    <div style={{ alignSelf: "stretch", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start", }}>

                                        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", }}>
                                            <Image src="/Ellipse 2.svg" style={{ alignSelf: "stretch", height: "1px", position: "relative", maxWidth: "100%", overflow: "hidden", flexShrink: "0", width: "100%", }} width={343} height={1} sizes="100vw" alt="" />
                                        </div>
                                        <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px", gap: "8px", fontSize: "16px", color: "#7a7c80", }}>
                                            <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", color: "#141414", }}>
                                                <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center", gap: "4px", }}>
                                                    <div style={{
                                                        width: "20px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent: "flex-start", // hoặc 'center' nếu muốn giữa dòng
                                                    }}>
                                                        <Image
                                                            src="/Ellipse 2.svg"
                                                            style={{ width: "10px", height: "10px", marginTop: "2px" }}
                                                            width={10}
                                                            height={10}
                                                            alt=""
                                                        />
                                                        <div
                                                            style={{
                                                                width: "0.5px",
                                                                flex: 1,
                                                                borderRight: "0.5px solid #d3d5db",
                                                                boxSizing: "border-box",
                                                                marginTop: "2px", // tùy chỉnh nhỏ để căn line
                                                            }}
                                                        />
                                                    </div>

                                                    <div style={{ width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0px 0px 8px", boxSizing: "border-box", gap: "2px", }}>
                                                        <div style={{ alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500", }}>{getNhaGiat(d.NhaGiat)}</div>
                                                        <div style={{ alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80", }}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                                    </div>
                                                </div>
                                                <div style={{ alignSelf: "stretch", height: "62px", display: "flex", alignItems: "center", gap: "4px", }}>
                                                    <Image src="/Ellipse 2.svg" style={{ alignSelf: "stretch", width: "10px", maxHeight: "100%", }} width={10} height={62} sizes="100vw" alt="" />
                                                    <div style={{ width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", }}>
                                                        <div style={{ alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500", }}>{getDiaDiem(d.ID_DiaDiem)}</div>
                                                        <div style={{ alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80", }}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ alignSelf: "stretch", height: "1px", position: "relative", borderTop: "1px dashed #c4c6cc", boxSizing: "border-box", }} />
                                            <div style={{ display: "flex", alignItems: "center", }}>
                                                <div style={{ width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0", }}>{`Đơn hàng chờ giao: `}</div>
                                                <div style={{ borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter", }}>
                                                    <div style={{ position: "relative", lineHeight: "20px", fontWeight: "500", }}>{getResult("CHO_VAN_CHUYEN_LAI", d.ID_DiaDiem, d.NhaGiat)} đơn</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", }}>
                                                <div style={{ width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0", }}>{`Đơn hàng đang giao: `}</div>
                                                <div style={{ borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter", }}>
                                                    <div style={{ position: "relative", lineHeight: "20px", fontWeight: "500", }}>{getResult("VAN_CHUYEN_LAI", d.ID_DiaDiem, d.NhaGiat)} đơn</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </li>
                        );
                    })}
                </ul>
            </main>
        );
    };


}
