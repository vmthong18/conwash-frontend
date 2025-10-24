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
    		<div style={{width: "100%", height: "812px", position: "relative", backgroundColor: "#f2f4f7", overflow: "hidden", textAlign: "left", fontSize: "14px", color: "#141414", fontFamily: "Roboto",}}>
      			<div style={{position: "absolute", height: "calc(100% - 142px)", width: "100%", top: "108px", right: "0px", bottom: "34px", left: "0px", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", boxSizing: "border-box",}}>
        				<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "16px",}}>
          					<div style={{width: "343px", borderRadius: "12px", backgroundColor: "#e7eefc", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
            						<div style={{alignSelf: "stretch", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
              							<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", gap: "20px",}}>
                								<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>Vận chuyển</div>
                								<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", color: "#1059e0", fontFamily: "Inter",}}>
                  									<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                								</div>
              							</div>
              							<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
                								<img style={{alignSelf: "stretch", height: "1px", position: "relative", maxWidth: "100%", overflow: "hidden", flexShrink: "0",}} alt="" />
              							</div>
              							<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px", gap: "8px", fontSize: "16px", color: "#7a7c80",}}>
                								<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", color: "#141414",}}>
                  									<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", gap: "4px",}}>
                    										<div style={{alignSelf: "stretch", width: "20px", display: "flex", flexDirection: "column", alignItems: "center",}}>
                      											<img style={{width: "20px", height: "20px",}} alt="" />
                      											<div style={{width: "0.5px", flex: "1", position: "relative", borderRight: "0.5px solid #d3d5db", boxSizing: "border-box",}} />
                    										</div>
                    										<div style={{width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0px 0px 8px", boxSizing: "border-box", gap: "2px",}}>
                      											<div style={{alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500",}}>Box Quận 1</div>
                      											<div style={{alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80",}}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                  									<div style={{alignSelf: "stretch", height: "62px", display: "flex", alignItems: "center", gap: "4px",}}>
                    										<img style={{alignSelf: "stretch", width: "20px", maxHeight: "100%",}} alt="" />
                    										<div style={{width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",}}>
                      											<div style={{alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500",}}>Box Quận 1</div>
                      											<div style={{alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80",}}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                								</div>
                								<div style={{alignSelf: "stretch", height: "1px", position: "relative", borderTop: "1px dashed #c4c6cc", boxSizing: "border-box",}} />
                								<div style={{display: "flex", alignItems: "center",}}>
                  									<div style={{width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0",}}>{`Đơn hàng chờ giao: `}</div>
                  									<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter",}}>
                    										<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                  									</div>
                								</div>
                								<div style={{display: "flex", alignItems: "center",}}>
                  									<div style={{width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0",}}>{`Đơn hàng đang giao: `}</div>
                  									<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter",}}>
                    										<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", textAlign: "center", color: "#fff",}}>
              							<div style={{borderRadius: "8px", backgroundColor: "#1059e0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 8px",}}>
                								<div style={{position: "relative", lineHeight: "20px",}}>{`Đã giao thành công `}</div>
              							</div>
            						</div>
          					</div>
          					<div style={{width: "343px", borderRadius: "12px", backgroundColor: "#e7eefc", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
            						<div style={{alignSelf: "stretch", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
              							<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", gap: "20px",}}>
                								<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>Vận chuyển</div>
                								<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", color: "#1059e0", fontFamily: "Inter",}}>
                  									<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                								</div>
              							</div>
              							<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
                								<img style={{alignSelf: "stretch", height: "1px", position: "relative", maxWidth: "100%", overflow: "hidden", flexShrink: "0",}} alt="" />
              							</div>
              							<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px", gap: "8px", fontSize: "16px", color: "#7a7c80",}}>
                								<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", color: "#141414",}}>
                  									<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", gap: "4px",}}>
                    										<div style={{alignSelf: "stretch", width: "20px", display: "flex", flexDirection: "column", alignItems: "center",}}>
                      											<img style={{width: "20px", height: "20px",}} alt="" />
                      											<div style={{width: "0.5px", flex: "1", position: "relative", borderRight: "0.5px solid #d3d5db", boxSizing: "border-box",}} />
                    										</div>
                    										<div style={{width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0px 0px 8px", boxSizing: "border-box", gap: "2px",}}>
                      											<div style={{alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500",}}>Box Quận 1</div>
                      											<div style={{alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",}}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                  									<div style={{alignSelf: "stretch", height: "62px", display: "flex", alignItems: "center", gap: "4px",}}>
                    										<img style={{alignSelf: "stretch", width: "20px", maxHeight: "100%",}} alt="" />
                    										<div style={{width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",}}>
                      											<div style={{alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500",}}>Box Quận 1</div>
                      											<div style={{alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",}}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                								</div>
                								<div style={{alignSelf: "stretch", height: "1px", position: "relative", borderTop: "1px dashed #c4c6cc", boxSizing: "border-box",}} />
                								<div style={{display: "flex", alignItems: "center",}}>
                  									<div style={{width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0",}}>{`Đơn hàng đã giao: `}</div>
                  									<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter",}}>
                    										<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                  									</div>
                								</div>
                								<div style={{display: "flex", alignItems: "center",}}>
                  									<div style={{width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0",}}>{`Đơn hàng đang giao: `}</div>
                  									<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter",}}>
                    										<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", textAlign: "center", color: "#fff",}}>
              							<div style={{borderRadius: "8px", backgroundColor: "#1059e0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 8px",}}>
                								<div style={{position: "relative", lineHeight: "20px",}}>{`Đã giao thành công `}</div>
              							</div>
            						</div>
          					</div>
          					<div style={{width: "343px", borderRadius: "12px", backgroundColor: "#e7eefc", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
            						<div style={{alignSelf: "stretch", borderRadius: "12px", backgroundColor: "#fff", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
              							<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", gap: "20px",}}>
                								<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>Vận chuyển</div>
                								<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", color: "#1059e0", fontFamily: "Inter",}}>
                  									<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                								</div>
              							</div>
              							<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
                								<img style={{alignSelf: "stretch", height: "1px", position: "relative", maxWidth: "100%", overflow: "hidden", flexShrink: "0",}} alt="" />
              							</div>
              							<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "12px", gap: "8px", fontSize: "16px", color: "#7a7c80",}}>
                								<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", color: "#141414",}}>
                  									<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", gap: "4px",}}>
                    										<div style={{alignSelf: "stretch", width: "20px", display: "flex", flexDirection: "column", alignItems: "center",}}>
                      											<img style={{width: "20px", height: "20px",}} alt="" />
                      											<div style={{width: "0.5px", flex: "1", position: "relative", borderRight: "0.5px solid #d3d5db", boxSizing: "border-box",}} />
                    										</div>
                    										<div style={{width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "0px 0px 8px", boxSizing: "border-box", gap: "2px",}}>
                      											<div style={{alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500",}}>Box Quận 1</div>
                      											<div style={{alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80",}}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                  									<div style={{alignSelf: "stretch", height: "62px", display: "flex", alignItems: "center", gap: "4px",}}>
                    										<img style={{alignSelf: "stretch", width: "20px", maxHeight: "100%",}} alt="" />
                    										<div style={{width: "292px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",}}>
                      											<div style={{alignSelf: "stretch", position: "relative", lineHeight: "24px", fontWeight: "500",}}>Box Quận 1</div>
                      											<div style={{alignSelf: "stretch", position: "relative", fontSize: "14px", lineHeight: "20px", color: "#7a7c80",}}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                								</div>
                								<div style={{alignSelf: "stretch", height: "1px", position: "relative", borderTop: "1px dashed #c4c6cc", boxSizing: "border-box",}} />
                								<div style={{display: "flex", alignItems: "center",}}>
                  									<div style={{width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0",}}>{`Đơn hàng đã giao: `}</div>
                  									<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter",}}>
                    										<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                  									</div>
                								</div>
                								<div style={{display: "flex", alignItems: "center",}}>
                  									<div style={{width: "156px", position: "relative", lineHeight: "24px", display: "inline-block", flexShrink: "0",}}>{`Đơn hàng đang giao: `}</div>
                  									<div style={{borderRadius: "8px", backgroundColor: "#e7eefc", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px", fontSize: "14px", color: "#1059e0", fontFamily: "Inter",}}>
                    										<div style={{position: "relative", lineHeight: "20px", fontWeight: "500",}}>23 đơn</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", textAlign: "center", color: "#fff",}}>
              							<div style={{borderRadius: "8px", backgroundColor: "#1059e0", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 8px",}}>
                								<div style={{position: "relative", lineHeight: "20px",}}>{`Đã giao thành công `}</div>
              							</div>
            						</div>
          					</div>
        				</div>
      			</div>
      			<div style={{position: "absolute", top: "44px", left: "0px", width: "375px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", fontSize: "16px", color: "#333",}}>
        				<div style={{alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-end", zIndex: "2",}}>
          					<div style={{alignSelf: "stretch", display: "flex", alignItems: "center", padding: "8px 4px", fontSize: "20px",}}>
            						<div style={{flex: "1", display: "flex", alignItems: "center", padding: "0px 12px",}}>
              							<img style={{width: "83px", position: "relative", maxHeight: "100%", objectFit: "cover", flexShrink: "0",}} alt="" />
              							<div style={{width: "193px", display: "none", alignItems: "center", padding: "11px 0px", boxSizing: "border-box", gap: "2px", flexShrink: "0",}}>
                								<div style={{flex: "1", position: "relative", lineHeight: "28px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",}}>Chi tiết mặt hàng</div>
                								<div style={{height: "16px", width: "16px", position: "relative", overflow: "hidden", flexShrink: "0", display: "none",}} />
              							</div>
            						</div>
            						<img style={{height: "48px", width: "48px", borderRadius: "8px",}} alt="" />
          					</div>
          					<div style={{width: "375px", display: "none", flexDirection: "column", alignItems: "flex-start", padding: "0px 16px 16px", boxSizing: "border-box", color: "#999",}}>
            						<div style={{alignSelf: "stretch", filter: "drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.1)) drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.04))", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
              							<div style={{alignSelf: "stretch", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "flex-start",}}>
                								<div style={{alignSelf: "stretch", borderRadius: "8px", backgroundColor: "#fff", border: "1px solid rgba(0, 0, 0, 0.2)", overflow: "hidden", display: "flex", alignItems: "center", zIndex: "0",}}>
                  									<div style={{flex: "1", display: "flex", alignItems: "center", padding: "8px 8px 8px 12px", gap: "8px", zIndex: "0",}}>
                    										<div style={{height: "20px", width: "20px", position: "relative", overflow: "hidden", flexShrink: "0",}}>
                      											<div style={{position: "relative", backgroundColor: "#666", width: "15px", height: "15px",}}>
                        												<img style={{position: "absolute", height: "100%", width: "100%", top: "15.28%", right: "-15.28%", bottom: "-15.28%", left: "15.28%", maxWidth: "100%", overflow: "hidden", maxHeight: "100%",}} alt="" />
                        												<img style={{position: "absolute", height: "100%", width: "100%", top: "15.28%", right: "-15.28%", bottom: "-15.28%", left: "15.28%", maxWidth: "100%", overflow: "hidden", maxHeight: "100%",}} alt="" />
                      											</div>
                    										</div>
                    										<div style={{flex: "1", display: "flex", alignItems: "center", padding: "0px 4px 0px 0px",}}>
                      											<div style={{flex: "1", overflow: "hidden", display: "flex", alignItems: "center",}}>
                        												<div style={{flex: "1", position: "relative", letterSpacing: "0.5px", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", zIndex: "0",}}>Nhập nội dung tìm kiếm tin tức</div>
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div style={{width: "147px", display: "none", alignItems: "flex-start", padding: "8px 16px 24px", boxSizing: "border-box",}}>
            						<div style={{display: "flex", alignItems: "center", gap: "12px",}}>
              							<div style={{height: "16px", width: "16px", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", boxSizing: "border-box",}}>
                								<div style={{borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", zIndex: "0",}}>
                  									<div style={{height: "20px", width: "20px", position: "relative", overflow: "hidden", flexShrink: "0", zIndex: "0",}}>
                    										<img style={{position: "relative", width: "15px", height: "15px",}} alt="" />
                  									</div>
                								</div>
              							</div>
              							<div style={{position: "relative", letterSpacing: "0.5px", lineHeight: "24px",}}>Chọn tất cả</div>
            						</div>
          					</div>
        				</div>
        				<div style={{width: "375px", height: "1px", overflow: "hidden", flexShrink: "0", display: "none", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", zIndex: "1",}} />
        				<div style={{width: "100%", height: "100%", position: "absolute", margin: "0", top: "0px", right: "0px", bottom: "0px", left: "0px", display: "none", zIndex: "0",}}>
          					<div style={{position: "absolute", height: "100%", width: "100%", top: "0px", right: "0px", bottom: "0px", left: "0px", boxShadow: "0px 4px 12px -2px rgba(0, 0, 0, 0.1), 0px 0px 4px rgba(0, 0, 0, 0.04)", backgroundColor: "#fff", display: "none",}} />
          					<div style={{position: "absolute", height: "100%", width: "100%", top: "0px", right: "0px", bottom: "0px", left: "0px", backgroundColor: "#fff", display: "none",}} />
        				</div>
      			</div>
      			<div style={{position: "absolute", width: "100%", right: "0px", bottom: "0px", left: "0px", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "21px 120px 8px", boxSizing: "border-box",}}>
        				<div style={{width: "135px", height: "5px", position: "relative", borderRadius: "2.5px", backgroundColor: "#000", zIndex: "0",}} />
      			</div>
      			<div style={{position: "absolute", width: "100%", top: "0px", right: "0px", left: "0px", height: "44px", overflow: "hidden", textAlign: "center", fontSize: "15px", color: "#000", fontFamily: "'SF Pro Text'",}}>
        				<div style={{position: "absolute", top: "18.33px", right: "15.37px", width: "24.3px", height: "11.3px",}}>
          					<div style={{position: "absolute", top: "0px", right: "2.3px", borderRadius: "2.67px", backgroundColor: "#000", border: "1px solid #000", boxSizing: "border-box", width: "22px", height: "11.3px", opacity: "0.35", mixBlendMode: "normal",}} />
          					<img style={{position: "absolute", top: "3.67px", right: "0px", width: "1.3px", height: "4px", opacity: "0.4", mixBlendMode: "normal",}} alt="" />
          					<div style={{position: "absolute", top: "2px", right: "4.3px", borderRadius: "1.33px", backgroundColor: "#000", width: "18px", height: "7.3px",}} />
        				</div>
        				<div style={{position: "relative", backgroundColor: "#000", width: "15.3px", height: "11px",}}>
          					<img style={{position: "absolute", top: "19px", right: "-313px", width: "15.3px", height: "4.8px",}} alt="" />
          					<img style={{position: "absolute", top: "22.81px", right: "-310.37px", width: "10px", height: "3.6px",}} alt="" />
          					<img style={{position: "absolute", top: "26.62px", right: "-307.64px", width: "4.6px", height: "3.4px",}} alt="" />
        				</div>
        				<img style={{position: "relative", width: "17px", height: "10.7px",}} alt="" />
        				<div style={{position: "absolute", top: "14px", left: "16px", fontWeight: "600", display: "inline-block", width: "54px",}}>9:41</div>
      			</div>
    		</div>);
};


}
