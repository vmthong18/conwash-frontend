// src/app/dashboard/diadiem/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutBtn from "../LogoutBtn";
import { directusFetch } from "@/lib/directusFetch";

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
    return (

       <main className="p-6">
            <div className="w-96 h-[812px] relative bg-neutral-base-surface overflow-hidden">
    <div className="w-96 h-[670px] p-4 left-0 top-[108px] absolute inline-flex flex-col justify-start items-center gap-6">
        <div className="self-stretch flex flex-col justify-start items-start gap-4">
            <div className="w-80 bg-primary-primary-50 rounded-xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-start overflow-hidden">
                <div className="self-stretch bg-background-base-on-surface1 rounded-xl flex flex-col justify-start items-start overflow-hidden">
                    <div className="self-stretch px-3 py-2 inline-flex justify-between items-center">
                        <div className="justify-start text-neutral-base-element-primary text-sm font-medium font-['Roboto'] leading-5">Vận chuyển</div>
                        <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                            <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                        </div>
                    </div>
                    <div data-space="0" data-style="Horizontal" data-type="Light" className="self-stretch flex flex-col justify-start items-start">
                        <div className="self-stretch h-px bg-neutral-base-stroke-bold" />
                    </div>
                    <div className="self-stretch p-3 flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch flex flex-col justify-start items-start">
                            <div className="self-stretch inline-flex justify-start items-center gap-1">
                                <div className="w-5 self-stretch inline-flex flex-col justify-start items-center">
                                    <div className="w-5 h-5 p-1.5 inline-flex justify-start items-center gap-2.5">
                                        <div className="w-2 h-2 bg-primary-primary-500 rounded-full" />
                                    </div>
                                    <div className="w-14 flex-1 origin-top-left rotate-90 outline outline-[0.50px] outline-offset-[-0.25px] outline-neutral-base-stroke-bold"></div>
                                </div>
                                <div className="w-72 pb-2 inline-flex flex-col justify-start items-start gap-0.5">
                                    <div className="self-stretch justify-start text-neutral-base-element-primary text-base font-medium font-['Roboto'] leading-6">Box Quận 1</div>
                                    <div className="self-stretch justify-start text-neutral-base-element-tertiary text-sm font-normal font-['Roboto'] leading-5">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                </div>
                            </div>
                            <div className="self-stretch h-16 inline-flex justify-start items-center gap-1">
                                <div className="w-5 self-stretch flex justify-center items-start gap-2.5">
                                    <div className="p-1 flex justify-start items-center gap-2.5">
                                        <div className="w-2 h-2 bg-primary-primary-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="w-72 inline-flex flex-col justify-start items-start gap-0.5">
                                    <div className="self-stretch justify-start text-neutral-base-element-primary text-base font-medium font-['Roboto'] leading-6">Box Quận 1</div>
                                    <div className="self-stretch justify-start text-neutral-base-element-tertiary text-sm font-normal font-['Roboto'] leading-5">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                </div>
                            </div>
                        </div>
                        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-base-stroke-light"></div>
                        <div className="inline-flex justify-start items-center">
                            <div className="w-40 justify-start text-text-neutral-body text-base font-normal font-['Roboto'] leading-6">Đơn hàng chờ giao: </div>
                            <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                                <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                            </div>
                        </div>
                        <div className="inline-flex justify-start items-center">
                            <div className="w-40 justify-start text-text-neutral-body text-base font-normal font-['Roboto'] leading-6">Đơn hàng đang giao: </div>
                            <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                                <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="self-stretch px-3 py-2 inline-flex justify-end items-center gap-52">
                    <div data-icon-button="No" data-sate="Regular" data-show-icon-left="false" data-show-icon-right="false" data-size="S-32" data-style="Filled" data-type="Primary" className="px-2 py-1.5 bg-primary-primary-500 rounded-lg flex justify-center items-center gap-2 overflow-hidden">
                        <div className="text-center justify-start text-neutral-white text-sm font-normal font-['Roboto'] leading-5">Đã giao thành công </div>
                    </div>
                </div>
            </div>
            <div className="w-80 bg-primary-primary-50 rounded-xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-start overflow-hidden">
                <div className="self-stretch bg-background-base-on-surface1 rounded-xl flex flex-col justify-start items-start overflow-hidden">
                    <div className="self-stretch px-3 py-2 inline-flex justify-between items-center">
                        <div className="justify-start text-neutral-base-element-primary text-sm font-medium font-['Roboto'] leading-5">Vận chuyển</div>
                        <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                            <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                        </div>
                    </div>
                    <div data-space="0" data-style="Horizontal" data-type="Light" className="self-stretch flex flex-col justify-start items-start">
                        <div className="self-stretch h-px bg-neutral-base-stroke-bold" />
                    </div>
                    <div className="self-stretch p-3 flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch flex flex-col justify-start items-start">
                            <div className="self-stretch inline-flex justify-start items-center gap-1">
                                <div className="w-5 self-stretch inline-flex flex-col justify-start items-center">
                                    <div className="w-5 h-5 p-1.5 inline-flex justify-start items-center gap-2.5">
                                        <div className="w-2 h-2 bg-primary-primary-500 rounded-full" />
                                    </div>
                                    <div className="w-8 flex-1 origin-top-left rotate-90 outline outline-[0.50px] outline-offset-[-0.25px] outline-neutral-base-stroke-bold"></div>
                                </div>
                                <div className="w-72 pb-2 inline-flex flex-col justify-start items-start gap-0.5">
                                    <div className="self-stretch justify-start text-neutral-base-element-primary text-base font-medium font-['Roboto'] leading-6">Box Quận 1</div>
                                    <div className="self-stretch justify-start text-neutral-base-element-tertiary text-sm font-normal font-['Roboto'] leading-5 line-clamp-1">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                </div>
                            </div>
                            <div className="self-stretch h-16 inline-flex justify-start items-center gap-1">
                                <div className="w-5 self-stretch flex justify-center items-start gap-2.5">
                                    <div className="p-1 flex justify-start items-center gap-2.5">
                                        <div className="w-2 h-2 bg-primary-primary-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="w-72 inline-flex flex-col justify-start items-start gap-0.5">
                                    <div className="self-stretch justify-start text-neutral-base-element-primary text-base font-medium font-['Roboto'] leading-6">Box Quận 1</div>
                                    <div className="self-stretch justify-start text-neutral-base-element-tertiary text-sm font-normal font-['Roboto'] leading-5 line-clamp-1">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                </div>
                            </div>
                        </div>
                        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-base-stroke-light"></div>
                        <div className="inline-flex justify-start items-center">
                            <div className="w-40 justify-start text-text-neutral-body text-base font-normal font-['Roboto'] leading-6">Đơn hàng đã giao: </div>
                            <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                                <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                            </div>
                        </div>
                        <div className="inline-flex justify-start items-center">
                            <div className="w-40 justify-start text-text-neutral-body text-base font-normal font-['Roboto'] leading-6">Đơn hàng đang giao: </div>
                            <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                                <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="self-stretch px-3 py-2 inline-flex justify-end items-center gap-52">
                    <div data-icon-button="No" data-sate="Regular" data-show-icon-left="false" data-show-icon-right="false" data-size="S-32" data-style="Filled" data-type="Primary" className="px-2 py-1.5 bg-primary-primary-500 rounded-lg flex justify-center items-center gap-2 overflow-hidden">
                        <div className="text-center justify-start text-neutral-white text-sm font-normal font-['Roboto'] leading-5">Đã giao thành công </div>
                    </div>
                </div>
            </div>
            <div className="w-80 bg-primary-primary-50 rounded-xl outline outline-1 outline-offset-[-1px] flex flex-col justify-start items-start overflow-hidden">
                <div className="self-stretch bg-background-base-on-surface1 rounded-xl flex flex-col justify-start items-start overflow-hidden">
                    <div className="self-stretch px-3 py-2 inline-flex justify-between items-center">
                        <div className="justify-start text-neutral-base-element-primary text-sm font-medium font-['Roboto'] leading-5">Vận chuyển</div>
                        <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                            <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                        </div>
                    </div>
                    <div data-space="0" data-style="Horizontal" data-type="Light" className="self-stretch flex flex-col justify-start items-start">
                        <div className="self-stretch h-px bg-neutral-base-stroke-bold" />
                    </div>
                    <div className="self-stretch p-3 flex flex-col justify-start items-start gap-2">
                        <div className="self-stretch flex flex-col justify-start items-start">
                            <div className="self-stretch inline-flex justify-start items-center gap-1">
                                <div className="w-5 self-stretch inline-flex flex-col justify-start items-center">
                                    <div className="w-5 h-5 p-1.5 inline-flex justify-start items-center gap-2.5">
                                        <div className="w-2 h-2 bg-primary-primary-500 rounded-full" />
                                    </div>
                                    <div className="w-14 flex-1 origin-top-left rotate-90 outline outline-[0.50px] outline-offset-[-0.25px] outline-neutral-base-stroke-bold"></div>
                                </div>
                                <div className="w-72 pb-2 inline-flex flex-col justify-start items-start gap-0.5">
                                    <div className="self-stretch justify-start text-neutral-base-element-primary text-base font-medium font-['Roboto'] leading-6">Box Quận 1</div>
                                    <div className="self-stretch justify-start text-neutral-base-element-tertiary text-sm font-normal font-['Roboto'] leading-5">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                </div>
                            </div>
                            <div className="self-stretch h-16 inline-flex justify-start items-center gap-1">
                                <div className="w-5 self-stretch flex justify-center items-start gap-2.5">
                                    <div className="p-1 flex justify-start items-center gap-2.5">
                                        <div className="w-2 h-2 bg-primary-primary-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="w-72 inline-flex flex-col justify-start items-start gap-0.5">
                                    <div className="self-stretch justify-start text-neutral-base-element-primary text-base font-medium font-['Roboto'] leading-6">Box Quận 1</div>
                                    <div className="self-stretch justify-start text-neutral-base-element-tertiary text-sm font-normal font-['Roboto'] leading-5">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                                </div>
                            </div>
                        </div>
                        <div className="self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-neutral-base-stroke-light"></div>
                        <div className="inline-flex justify-start items-center">
                            <div className="w-40 justify-start text-text-neutral-body text-base font-normal font-['Roboto'] leading-6">Đơn hàng đã giao: </div>
                            <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                                <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                            </div>
                        </div>
                        <div className="inline-flex justify-start items-center">
                            <div className="w-40 justify-start text-text-neutral-body text-base font-normal font-['Roboto'] leading-6">Đơn hàng đang giao: </div>
                            <div data-l-icon="false" data-r-icon="false" data-type="Infor" className="px-2 py-1 bg-background-support-info rounded-lg flex justify-center items-center gap-1">
                                <div className="justify-start text-text-support-link text-sm font-medium font-['Inter'] leading-5">23 đơn</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="self-stretch px-3 py-2 inline-flex justify-end items-center gap-52">
                    <div data-icon-button="No" data-sate="Regular" data-show-icon-left="false" data-show-icon-right="false" data-size="S-32" data-style="Filled" data-type="Primary" className="px-2 py-1.5 bg-primary-primary-500 rounded-lg flex justify-center items-center gap-2 overflow-hidden">
                        <div className="text-center justify-start text-neutral-white text-sm font-normal font-['Roboto'] leading-5">Đã giao thành công </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div className="w-96 left-0 top-[44px] absolute inline-flex flex-col justify-end items-start">
        <div className="self-stretch flex flex-col justify-end items-start">
            <div className="self-stretch px-1 py-2 inline-flex justify-start items-center">
                <div className="flex-1 px-3 flex justify-start items-center">
                    <img className="w-20 h-10" src="https://placehold.co/83x40" />
                </div>
                <div className="w-12 h-12 p-3 rounded-lg flex justify-center items-center">
                    <div className="w-5 h-5 relative overflow-hidden">
                        <div className="w-2.5 h-[1.25px] left-[10.83px] top-[8.13px] absolute bg-neutral-base-element-secondary" />
                        <div className="w-1 h-2 left-[15.62px] top-[5px] absolute bg-neutral-base-element-secondary" />
                        <div className="w-2 h-5 left-0 top-0 absolute bg-neutral-base-element-secondary" />
                        <div className="w-3 h-1.5 left-[1.04px] top-0 absolute bg-neutral-base-element-secondary" />
                        <div className="w-1.5 h-1.5 left-[7.08px] top-[10.83px] absolute bg-neutral-base-element-secondary" />
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div data-bg="false" data-device="iphone" data-mode="on Light" data-type="Portrait" className="w-96 px-28 pt-5 pb-2 left-0 top-[778px] absolute inline-flex flex-col justify-end items-center gap-1 overflow-hidden">
        <div className="w-32 h-[5px] bg-black rounded-sm" />
    </div>
    <div data-bg="false" data-camera-cutout="true" data-devices="iPhoneX" data-mode="on Light" className="w-96 h-11 left-0 top-0 absolute overflow-hidden">
        <div className="w-5 h-3 left-[335.33px] top-[18.33px] absolute opacity-30 bg-black rounded-sm border border-black" />
        <div className="w-[1.33px] h-1 left-[358.33px] top-[22px] absolute opacity-40 bg-black" />
        <div className="w-4 h-2 left-[337.33px] top-[20.33px] absolute bg-black rounded-sm" />
        <div className="w-14 left-[16px] top-[14px] absolute text-center justify-start text-black text-base font-semibold font-['SF_Pro_Text']">9:41</div>
    </div>
</div>
        </main>

    );
}
