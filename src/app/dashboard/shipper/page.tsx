// src/app/dashboard/diadiem/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutBtn from "../LogoutBtn";
import { directusFetch } from "@/lib/directusFetch";
import type { NextPage } from 'next';
import Image  from "next/image";
import styles from './index.module.css';

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
    		<div className={styles.main}>
      			<div className={styles.instanceParent}>
        				<div className={styles.frameParent}>
          					<div className={styles.rowHeaderParent}>
            						<div className={styles.rowHeader}>
              							<div className={styles.vnChuyn}>Vận chuyển</div>
              							<div className={styles.statusTag}>
                								<div className={styles.vnChuyn}>23 đơn</div>
              							</div>
            						</div>
            						<div className={styles.divider}>
              							<div className={styles.line1Stroke}  />
            						</div>
            						<div className={styles.frameGroup}>
              							<div className={styles.frameContainer}>
                								<div className={styles.frameDiv}>
                  									<div className={styles.mainFrameParent}>
                    										<div className={styles.frameChild}  />
                    										<div className={styles.frameItem} />
                  									</div>
                  									<div className={styles.boxQun1Parent}>
                    										<div className={styles.boxQun1}>Box Quận 1</div>
                    										<div className={styles.trnVnSc}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                  									</div>
                								</div>
                								<div className={styles.frameParent2}>
                  									<div className={styles.frameInner} />
                  									<div className={styles.boxQun1Group}>
                    										<div className={styles.boxQun1}>Box Quận 1</div>
                    										<div className={styles.trnVnSc}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.lineDiv} />
              							<div className={styles.nHngGiaoParent}>
                								<div className={styles.nHng}>{`Đơn hàng chờ giao: `}</div>
                								<div className={styles.mainStatusTag}>
                  									<div className={styles.vnChuyn}>23 đơn</div>
                								</div>
              							</div>
              							<div className={styles.nHngGiaoParent}>
                								<div className={styles.nHng}>{`Đơn hàng đang giao: `}</div>
                								<div className={styles.mainStatusTag}>
                  									<div className={styles.vnChuyn}>23 đơn</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.mainRowHeader}>
            						<div className={styles.button}>
              							<div className={styles.textButton}>{`Đã giao thành công `}</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.frameParent}>
          					<div className={styles.rowHeaderParent}>
            						<div className={styles.rowHeader}>
              							<div className={styles.vnChuyn}>Vận chuyển</div>
              							<div className={styles.statusTag}>
                								<div className={styles.vnChuyn}>23 đơn</div>
              							</div>
            						</div>
            						<div className={styles.divider}>
              							<div className={styles.line1Stroke}/>
            						</div>
            						<div className={styles.frameGroup}>
              							<div className={styles.frameContainer}>
                								<div className={styles.frameDiv}>
                  									<div className={styles.mainFrameParent}>
                    										<div className={styles.frameChild} />
                    										<div className={styles.frameItem} />
                  									</div>
                  									<div className={styles.boxQun1Parent}>
                    										<div className={styles.boxQun1}>Box Quận 1</div>
                    										<div className={styles.trnVnSc2}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                  									</div>
                								</div>
                								<div className={styles.frameParent2}>
                  									<div className={styles.frameInner} />
                  									<div className={styles.boxQun1Group}>
                    										<div className={styles.boxQun1}>Box Quận 1</div>
                    										<div className={styles.trnVnSc2}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.lineDiv} />
              							<div className={styles.nHngGiaoParent}>
                								<div className={styles.nHng}>{`Đơn hàng đã giao: `}</div>
                								<div className={styles.mainStatusTag}>
                  									<div className={styles.vnChuyn}>23 đơn</div>
                								</div>
              							</div>
              							<div className={styles.nHngGiaoParent}>
                								<div className={styles.nHng}>{`Đơn hàng đang giao: `}</div>
                								<div className={styles.mainStatusTag}>
                  									<div className={styles.vnChuyn}>23 đơn</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.mainRowHeader}>
            						<div className={styles.button}>
              							<div className={styles.textButton}>{`Đã giao thành công `}</div>
            						</div>
          					</div>
        				</div>
        				<div className={styles.frameParent}>
          					<div className={styles.rowHeaderParent}>
            						<div className={styles.rowHeader}>
              							<div className={styles.vnChuyn}>Vận chuyển</div>
              							<div className={styles.statusTag}>
                								<div className={styles.vnChuyn}>23 đơn</div>
              							</div>
            						</div>
            						<div className={styles.divider}>
              							<div className={styles.line1Stroke} />
            						</div>
            						<div className={styles.frameGroup}>
              							<div className={styles.frameContainer}>
                								<div className={styles.frameDiv}>
                  									<div className={styles.mainFrameParent}>
                    										<div className={styles.frameChild} />
                    										<div className={styles.frameItem} />
                  									</div>
                  									<div className={styles.boxQun1Parent}>
                    										<div className={styles.boxQun1}>Box Quận 1</div>
                    										<div className={styles.trnVnSc}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                  									</div>
                								</div>
                								<div className={styles.frameParent2}>
                  									<div className={styles.frameInner}  />
                  									<div className={styles.boxQun1Group}>
                    										<div className={styles.boxQun1}>Box Quận 1</div>
                    										<div className={styles.trnVnSc}>10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                  									</div>
                								</div>
              							</div>
              							<div className={styles.lineDiv} />
              							<div className={styles.nHngGiaoParent}>
                								<div className={styles.nHng}>{`Đơn hàng đã giao: `}</div>
                								<div className={styles.mainStatusTag}>
                  									<div className={styles.vnChuyn}>23 đơn</div>
                								</div>
              							</div>
              							<div className={styles.nHngGiaoParent}>
                								<div className={styles.nHng}>{`Đơn hàng đang giao: `}</div>
                								<div className={styles.mainStatusTag}>
                  									<div className={styles.vnChuyn}>23 đơn</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className={styles.mainRowHeader}>
            						<div className={styles.button}>
              							<div className={styles.textButton}>{`Đã giao thành công `}</div>
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>);
};


}
