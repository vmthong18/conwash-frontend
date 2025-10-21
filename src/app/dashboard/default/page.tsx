import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { directusFetch } from "@/lib/directusFetch";
export default async function defaultPage() {
    const jar = await cookies();
    const access = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
    if (!access) return <div className="p-8">Chưa đăng nhập.</div>;
    const meRes = await directusFetch(
        `${process.env.DIRECTUS_URL}/users/me?fields=role.name`,
        { headers: { Authorization: `Bearer ${access}` }, cache: "no-store" }
    );

    let roleName = "";
    if (meRes.ok) {
        const me = await meRes.json();
        roleName = me?.data?.role?.name ?? "";
    }
    if (roleName === "NhanVienQuay") {
        redirect(`/dashboard/diadiem`);
    }
    else if (roleName === "Shipper") {
        redirect(`/dashboard/shipper`);
    }
    else if (roleName === "Giat") {
        redirect(`/dashboard/donhang`);
    }
    else {
        redirect(`/dashboard`);

    }
    return <div className="p-8">Xin chào, bạn đang đăng nhập với vai trò: {roleName}</div>;
}