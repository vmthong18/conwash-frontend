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
    		<div className="w-full h-[812px] relative bg-whitesmoke overflow-hidden text-left text-num-14 text-gray-200 font-roboto">
      			<div className="absolute h-[calc(100%_-_142px)] w-full top-[108px] right-[0px] bottom-[34px] left-[0px] flex flex-col items-center p-4 box-border">
        				<div className="self-stretch flex flex-col items-start gap-4">
          					<div className="w-[343px] rounded-num-12 bg-lavender overflow-hidden flex flex-col items-start">
            						<div className="self-stretch rounded-num-12 bg-white overflow-hidden flex flex-col items-start">
              							<div className="self-stretch flex items-center justify-between py-2 px-3 gap-5">
                								<div className="relative leading-num-20 font-medium">Vận chuyển</div>
                								<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-royalblue font-inter">
                  									<div className="relative leading-num-20 font-medium">23 đơn</div>
                								</div>
              							</div>
              							<div className="self-stretch flex flex-col items-start">
                								
              							</div>
              							<div className="self-stretch flex flex-col items-start p-3 gap-2 text-num-16 text-gray-100">
                								<div className="self-stretch flex flex-col items-start text-gray-200">
                  									<div className="self-stretch flex items-center gap-1">
                    										<div className="self-stretch w-5 flex flex-col items-center">
                      										
                      											<div className="w-[0.5px] flex-1 relative border-lightgray border-solid border-r-[0.5px] box-border" />
                    										</div>
                    										<div className="w-num-292 flex flex-col items-start pt-num-0 px-num-0 pb-2 box-border gap-0.5">
                      											<div className="self-stretch relative leading-num-24 font-medium">Box Quận 1</div>
                      											<div className="self-stretch relative text-num-14 leading-num-20 text-gray-100">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                  									<div className="self-stretch h-[62px] flex items-center gap-1">
                    									
                    										<div className="w-num-292 flex flex-col items-start gap-0.5">
                      											<div className="self-stretch relative leading-num-24 font-medium">Box Quận 1</div>
                      											<div className="self-stretch relative text-num-14 leading-num-20 text-gray-100">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                								</div>
                								<div className="self-stretch h-px relative border-silver border-dashed border-t-[1px] box-border" />
                								<div className="flex items-center">
                  									<div className="w-num-156 relative leading-num-24 inline-block shrink-0">{`Đơn hàng chờ giao: `}</div>
                  									<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-num-14 text-royalblue font-inter">
                    										<div className="relative leading-num-20 font-medium">23 đơn</div>
                  									</div>
                								</div>
                								<div className="flex items-center">
                  									<div className="w-num-156 relative leading-num-24 inline-block shrink-0">{`Đơn hàng đang giao: `}</div>
                  									<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-num-14 text-royalblue font-inter">
                    										<div className="relative leading-num-20 font-medium">23 đơn</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div className="self-stretch flex items-center justify-end py-2 px-3 text-center text-white">
              							<div className="rounded-num-8 bg-royalblue overflow-hidden flex items-center justify-center py-1.5 px-2">
                								<div className="relative leading-num-20">{`Đã giao thành công `}</div>
              							</div>
            						</div>
          					</div>
          					<div className="w-[343px] rounded-num-12 bg-lavender overflow-hidden flex flex-col items-start">
            						<div className="self-stretch rounded-num-12 bg-white overflow-hidden flex flex-col items-start">
              							<div className="self-stretch flex items-center justify-between py-2 px-3 gap-5">
                								<div className="relative leading-num-20 font-medium">Vận chuyển</div>
                								<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-royalblue font-inter">
                  									<div className="relative leading-num-20 font-medium">23 đơn</div>
                								</div>
              							</div>
              							<div className="self-stretch flex flex-col items-start">
                								
              							</div>
              							<div className="self-stretch flex flex-col items-start p-3 gap-2 text-num-16 text-gray-100">
                								<div className="self-stretch flex flex-col items-start text-gray-200">
                  									<div className="self-stretch flex items-center gap-1">
                    										<div className="self-stretch w-5 flex flex-col items-center">
                      											
                      											<div className="w-[0.5px] flex-1 relative border-lightgray border-solid border-r-[0.5px] box-border" />
                    										</div>
                    										<div className="w-num-292 flex flex-col items-start pt-num-0 px-num-0 pb-2 box-border gap-0.5">
                      											<div className="self-stretch relative leading-num-24 font-medium">Box Quận 1</div>
                      											<div className="self-stretch relative text-num-14 leading-num-20 text-gray-100 overflow-hidden text-ellipsis whitespace-nowrap">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                  									<div className="self-stretch h-[62px] flex items-center gap-1">
                    									
                    										<div className="w-num-292 flex flex-col items-start gap-0.5">
                      											<div className="self-stretch relative leading-num-24 font-medium">Box Quận 1</div>
                      											<div className="self-stretch relative text-num-14 leading-num-20 text-gray-100 overflow-hidden text-ellipsis whitespace-nowrap">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                								</div>
                								<div className="self-stretch h-px relative border-silver border-dashed border-t-[1px] box-border" />
                								<div className="flex items-center">
                  									<div className="w-num-156 relative leading-num-24 inline-block shrink-0">{`Đơn hàng đã giao: `}</div>
                  									<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-num-14 text-royalblue font-inter">
                    										<div className="relative leading-num-20 font-medium">23 đơn</div>
                  									</div>
                								</div>
                								<div className="flex items-center">
                  									<div className="w-num-156 relative leading-num-24 inline-block shrink-0">{`Đơn hàng đang giao: `}</div>
                  									<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-num-14 text-royalblue font-inter">
                    										<div className="relative leading-num-20 font-medium">23 đơn</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div className="self-stretch flex items-center justify-end py-2 px-3 text-center text-white">
              							<div className="rounded-num-8 bg-royalblue overflow-hidden flex items-center justify-center py-1.5 px-2">
                								<div className="relative leading-num-20">{`Đã giao thành công `}</div>
              							</div>
            						</div>
          					</div>
          					<div className="w-[343px] rounded-num-12 bg-lavender overflow-hidden flex flex-col items-start">
            						<div className="self-stretch rounded-num-12 bg-white overflow-hidden flex flex-col items-start">
              							<div className="self-stretch flex items-center justify-between py-2 px-3 gap-5">
                								<div className="relative leading-num-20 font-medium">Vận chuyển</div>
                								<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-royalblue font-inter">
                  									<div className="relative leading-num-20 font-medium">23 đơn</div>
                								</div>
              							</div>
              							<div className="self-stretch flex flex-col items-start">
                							
              							</div>
              							<div className="self-stretch flex flex-col items-start p-3 gap-2 text-num-16 text-gray-100">
                								<div className="self-stretch flex flex-col items-start text-gray-200">
                  									<div className="self-stretch flex items-center gap-1">
                    										<div className="self-stretch w-5 flex flex-col items-center">
                      										
                      											<div className="w-[0.5px] flex-1 relative border-lightgray border-solid border-r-[0.5px] box-border" />
                    										</div>
                    										<div className="w-num-292 flex flex-col items-start pt-num-0 px-num-0 pb-2 box-border gap-0.5">
                      											<div className="self-stretch relative leading-num-24 font-medium">Box Quận 1</div>
                      											<div className="self-stretch relative text-num-14 leading-num-20 text-gray-100">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                  									<div className="self-stretch h-[62px] flex items-center gap-1">
                    										
                    										<div className="w-num-292 flex flex-col items-start gap-0.5">
                      											<div className="self-stretch relative leading-num-24 font-medium">Box Quận 1</div>
                      											<div className="self-stretch relative text-num-14 leading-num-20 text-gray-100">10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam</div>
                    										</div>
                  									</div>
                								</div>
                								<div className="self-stretch h-px relative border-silver border-dashed border-t-[1px] box-border" />
                								<div className="flex items-center">
                  									<div className="w-num-156 relative leading-num-24 inline-block shrink-0">{`Đơn hàng đã giao: `}</div>
                  									<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-num-14 text-royalblue font-inter">
                    										<div className="relative leading-num-20 font-medium">23 đơn</div>
                  									</div>
                								</div>
                								<div className="flex items-center">
                  									<div className="w-num-156 relative leading-num-24 inline-block shrink-0">{`Đơn hàng đang giao: `}</div>
                  									<div className="rounded-num-8 bg-lavender flex items-center justify-center py-num-4 px-2 text-num-14 text-royalblue font-inter">
                    										<div className="relative leading-num-20 font-medium">23 đơn</div>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div className="self-stretch flex items-center justify-end py-2 px-3 text-center text-white">
              							<div className="rounded-num-8 bg-royalblue overflow-hidden flex items-center justify-center py-1.5 px-2">
                								<div className="relative leading-num-20">{`Đã giao thành công `}</div>
              							</div>
            						</div>
          					</div>
        				</div>
      			</div>
      			<div className="absolute top-[44px] left-[0px] w-[375px] flex flex-col items-start justify-end text-num-16 text-darkslategray">
        				<div className="self-stretch flex flex-col items-start justify-end z-[2]">
          					<div className="self-stretch flex items-center py-2 px-num-4 text-[20px]">
            						<div className="flex-1 flex items-center py-num-0 px-3">
              							
              							<div className="w-[193px] hidden items-center py-[11px] px-num-0 box-border gap-0.5 shrink-0">
                								<div className="flex-1 relative leading-7 overflow-hidden text-ellipsis whitespace-nowrap">Chi tiết mặt hàng</div>
                								<div className="h-4 w-4 relative overflow-hidden shrink-0 hidden" />
              							</div>
            						</div>
            						
          					</div>
          					<div className="w-[375px] hidden flex-col items-start pt-num-0 px-4 pb-4 box-border text-darkgray">
            						<div className="self-stretch [filter:drop-shadow(0px_2px_8px_rgba(0,_0,_0,_0.1))_drop-shadow(0px_0px_2px_rgba(0,_0,_0,_0.04))] flex flex-col items-start">
              							<div className="self-stretch rounded-num-8 flex flex-col items-start">
                								<div className="self-stretch rounded-num-8 bg-white border-gray-300 border-solid border-[1px] overflow-hidden flex items-center z-[0]">
                  									<div className="flex-1 flex items-center py-2 pl-3 pr-2 gap-2 z-[0]">
                    										<div className="h-5 w-5 relative overflow-hidden shrink-0">
                      											<div className="relative bg-dimgray w-[15px] h-[15px]">
                        												
                      											</div>
                    										</div>
                    										<div className="flex-1 flex items-center py-num-0 pl-num-0 pr-num-4">
                      											<div className="flex-1 overflow-hidden flex items-center">
                        												<div className="flex-1 relative tracking-[0.5px] leading-num-24 overflow-hidden text-ellipsis whitespace-nowrap z-[0]">Nhập nội dung tìm kiếm tin tức</div>
                      											</div>
                    										</div>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<div className="w-[147px] hidden items-start pt-2 px-4 pb-6 box-border">
            						<div className="flex items-center gap-3">
              							<div className="h-4 w-4 flex items-center justify-center p-2 box-border">
                								<div className="rounded flex items-center justify-center p-num-4 z-[0]">
                  									<div className="h-5 w-5 relative overflow-hidden shrink-0 z-[0]">
                    									
                  									</div>
                								</div>
              							</div>
              							<div className="relative tracking-[0.5px] leading-num-24">Chọn tất cả</div>
            						</div>
          					</div>
        				</div>
        				<div className="w-[375px] h-px overflow-hidden shrink-0 hidden flex-col items-center justify-end z-[1]" />
        				<div className="w-full h-full absolute !!m-[0 important] top-[0px] right-[0px] bottom-[0px] left-[0px] hidden z-[0]">
          					<div className="absolute h-full w-full top-[0px] right-[0px] bottom-[0px] left-[0px] shadow-[0px_4px_12px_-2px_rgba(0,_0,_0,_0.1),_0px_0px_4px_rgba(0,_0,_0,_0.04)] bg-white hidden" />
          					<div className="absolute h-full w-full top-[0px] right-[0px] bottom-[0px] left-[0px] bg-white hidden" />
        				</div>
      			</div>
      			<div className="absolute w-full right-[0px] bottom-[0px] left-[0px] overflow-hidden flex flex-col items-center justify-end pt-[21px] px-[120px] pb-2 box-border">
        				<div className="w-[135px] h-[5px] relative rounded-[2.5px] bg-black z-[0]" />
      			</div>
      			<div className="absolute w-full top-[0px] right-[0px] left-[0px] h-11 overflow-hidden text-center text-[15px] text-black font-sf-pro-text">
        				<div className="absolute top-[18.33px] right-[15.37px] w-[24.3px] h-[11.3px]">
          					<div className="absolute top-[0px] right-[2.3px] rounded-[2.67px] bg-black border-black border-solid border-[1px] box-border w-[22px] h-[11.3px] opacity-[0.35] mix-blend-normal" />
          					
          					<div className="absolute top-[2px] right-[4.3px] rounded-[1.33px] bg-black w-[18px] h-[7.3px]" />
        				</div>
        				<div className="relative bg-black w-[15.3px] h-[11px]">
          					
        				</div>
        				
        				<div className="absolute top-[14px] left-[16px] font-semibold inline-block w-[54px]">9:41</div>
      			</div>
    		</div>);
};


}
