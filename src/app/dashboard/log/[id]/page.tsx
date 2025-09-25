import { cookies } from "next/headers";
import Link from "next/link";

type Revisions = {
    id: number;
    // action: string;
    //collection: string;
    activity: Activity;
    data: JSON;
    delta: JSON;

    //item: number;
    //timestamp: string;


    // Add other fields as needed
};
type DirectusUser = {
    id?: string;
    first_name?: string;
};

type Activity = {
    id: number;
    action: string;
    collection: string;
    item: string;         // Directus trả dạng string
    timestamp: string;
    user: DirectusUser;
};
const ASSETS =
    process.env.NEXT_PUBLIC_DIRECTUS_ASSETS ?? process.env.DIRECTUS_URL ?? "";

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

export default async function logDetail({
    params,
}: {
    params: { id: string };
}) {
    const access = (await cookies()).get(
        process.env.COOKIE_ACCESS || "be_giay_access"
    )?.value;
    if (!access) return <div className="p-8">Chưa đăng nhập.</div>;

    //const id = await params.id;
    const { id } = await params;
    const url_revisions = new URL(`${process.env.DIRECTUS_URL}/revisions`);
    url_revisions.searchParams.set("fields", "id,activity.id,activity.user.first_name,activity.action,activity.collection,activity.item,activity.timestamp,delta,data");
    url_revisions.searchParams.set("filter[collection][_eq]", "donhang");
    url_revisions.searchParams.set("filter[item][_eq]", id);

    const r_r = await fetch(url_revisions.toString(), {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
    });
    const rrJson = await r_r.json();
    const rv: Revisions[] = rrJson?.data ?? [];

    return (
        <main className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Log </h1>
                <Link href="/dashboard/donhang" className="text-blue-600 hover:underline">
                    ← Danh sách
                </Link>
            </div>
            <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                        <tr>

                            <th className="text-left p-2 border-b">Thời gian</th>
                            <th className="text-left p-2 border-b">Người dùng</th>
                            <th className="text-left p-2 border-b">Thao tác</th>
                            <th className="text-left p-2 border-b">Log xử lý</th>

                        </tr>
                    </thead>
                    <tbody>
                        {rv.map((d) => {
                            //const c = countsByLocation.get(d.ID) ?? 0;
                            //const c_gx = countsByLocation_gx.get(d.ID) ?? 0;
                            return (
                                <tr key={d.id} className="border-b">

                                    <td className="p-2">
                                        {new Date(d.activity.timestamp)
                                            .toLocaleString('vi-VN', {
                                                timeZone: 'Asia/Ho_Chi_Minh',
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false,
                                            })
                                            .replace(',', '')}

                                    </td>
                                    <td className="p-2">{d.activity.user.first_name}</td>
                                    <td className="p-2">{d.activity.action}</td>
                                    <td className="p-2">{JSON.stringify(d.delta)}</td>

                                </tr>
                            );
                        })}


                    </tbody>
                </table>

            </div>

        </main>
    );
}
