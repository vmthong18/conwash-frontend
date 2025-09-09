import { cookies } from "next/headers";
import LogoutBtn from "./LogoutBtn";

export default async function Dashboard() {
  const jar = await cookies();
  const access = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;

  let orders: any[] = [];
  let me: any = null;
  let roleName: string = "";

  if (access) {
    // Lấy thông tin user
    const meRes = await fetch(`${process.env.DIRECTUS_URL}/users/me?fields=role.name,first_name,email`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store"
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      me = meData?.data;
      roleName = me?.role?.name ?? "";
    }
    // Lấy đơn hàng (ví dụ chỉ lấy 10 đơn mới nhất; chỉnh filter theo nhu cầu)
    const res = await fetch(`${process.env.DIRECTUS_URL}/items/orders?limit=10&sort=-date_created`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json();
      orders = data?.data || [];
    }
  }

  async function Logout() {
    "use server";
    // gọi API logout (server action đơn giản)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/logout`, { method: "POST" });
  }

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LogoutBtn />
      </div>

      <section>
        <h2 className="text-lg font-semibold">Xin chào, {me?.first_name || me?.email || "User"}</h2>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Menu</h2>
        <ul className="mt-3 space-y-2">
          {["Administrator", "NhanVienQuay"].includes(roleName) && (
            <li className="bg-white p-3 rounded shadow">
              <div className="font-medium"></div>
              <div className="text-sm text-gray-600">
                <a href="/dashboard/phieuhang/">Danh sách phiếu hàng</a>
              </div>
            </li>
          )}
          {["Administrator", "Giat", "NhanVienQuay"].includes(roleName) && (
            <li className="bg-white p-3 rounded shadow">
              <div className="font-medium"></div>
              <div className="text-sm text-gray-600">
                <a href="/dashboard/donhang/">Danh sách đơn hàng</a>
              </div>
            </li>
          )}

          {["Administrator", "Admin"].includes(roleName) && (
            <li className="bg-white p-3 rounded shadow">
              <div className="font-medium"></div>
              <div className="text-sm text-gray-600">
                <a href="/dashboard/taodonhang/">Tạo QR</a>
              </div>

            </li>
          )}
          {["Administrator", "Admin"].includes(roleName) && (
            <li className="bg-white p-3 rounded shadow">
              <div className="font-medium"></div>
              <div className="text-sm text-gray-600">
                <a href="/dashboard/shipper/">Tạo QR</a>
              </div>

            </li>
          )}

        </ul>
      </section>
    </main>
  );
}
