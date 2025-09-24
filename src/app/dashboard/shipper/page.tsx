// src/app/dashboard/diadiem/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";

// Kiểu dữ liệu gọn gàng
type DiaDiem = { ID: number; TenDiaDiem: string };
type Mapping_NhaGiat = { ID: number; NhaGiat: string; ID_DiaDiem: number; Type: number;};
type NhaGiat = { id: string;first_name: string;last_name: string; title: string };
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

    const ddRes = await fetch(ddUrl.toString(), {
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

    const ddngRes = await fetch(ddng.toString(), {
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
    const nglst = new URL(`${API}/items/directus_users`);
    nglst.searchParams.set("sort", "ID_DiaDiem");
    nglst.searchParams.set("limit", "-1");

    const ngRes = await fetch(nglst.toString(), {
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
    async function getResult(trangthai: string,diadiem:number,nhagiat:string) {
        const cUrl_gx = new URL(`${API}/items/donhang`);
        cUrl_gx.searchParams.set("aggregate[count]", "*");
        cUrl_gx.searchParams.set("filter[TrangThai][_eq]", trangthai);
        cUrl_gx.searchParams.set("filter[ID_DiaDiem][_eq]", String(diadiem));
        cUrl_gx.searchParams.set("filter[NhaGiat][_eq]", nhagiat);
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
       
        <main className="p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Địa điểm đang hoạt động</h1>
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                    ← Về Dashboard
                </Link>
            </div>
 
            
            
        </main>
      
    );
}
