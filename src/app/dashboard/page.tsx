import { cookies } from "next/headers";
import LogoutBtn from "./LogoutBtn";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  ClipboardList,
  QrCode,
  Truck
} from "lucide-react";

// ---- Server component
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
  // Helper: 1 item kiểu “card menu”
  function MenuCard(props: {
    href: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }) {
    return (
      <Link
        href={props.href}
        className="block rounded-3xl bg-white p-4 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-50 p-2">{props.icon}</div>
          <div className="flex-1">
            <div className="font-semibold text-[16px] leading-tight">
              {props.title}
            </div>
            <div className="text-[13px] text-gray-500 mt-0.5">{props.desc}</div>
          </div>
          <ChevronRight className="shrink-0" size={18} />
        </div>
      </Link>
    );
  }
  return (
    <main className="min-h-dvh bg-gray-50">
       <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur">
                      <div className="mx-auto max-w-sm px-4 py-3 flex items-center gap-3">
                       
                          <h1 className="text-[20px] font-semibold"> Xin chào, {me?.first_name || me?.email || "User"}</h1>
      
                          <LogoutBtn/>
                      </div>
                  </div>
    

      {/* Nội dung chính */}
      <div className="mx-auto max-w-sm px-4 pb-8">
      

        {/* Nhóm menu theo quyền */}
        <div className="grid gap-3">
          {/* Danh sách đơn hàng */}
          {["Administrator", "NhanVienQuay"].includes(roleName) && (
            <MenuCard
              href="/dashboard/phieuhang/"
              title="Danh sách đơn hàng"
              desc="Xem đơn hàng theo khách hàng"
              icon={<ListOrdered size={20} className="text-blue-600" />}
            />
          )}

          {/* Danh sách mặt hàng */}
          {["Administrator", "Giat", "NhanVienQuay"].includes(roleName) && (
            <MenuCard
              href="/dashboard/donhang/"
              title="Danh sách mặt hàng"
              desc="Tổng hợp yêu cầu giặt"
              icon={<ClipboardList size={20} className="text-blue-600" />}
            />
          )}

          {/* Tạo QR */}
          {["Administrator", "Admin"].includes(roleName) && (
            <MenuCard
              href="/dashboard/taodonhang/"
              title="Tạo QR"
              desc="Tạo mã cho quy trình nhận hàng"
              icon={<QrCode size={20} className="text-blue-600" />}
            />
          )}

          {/* Shipper */}
          {["Administrator", "Admin"].includes(roleName) && (
            <MenuCard
              href="/dashboard/shipper/"
              title="Shipper"
              desc="Điều phối giao nhận"
              icon={<Truck size={20} className="text-blue-600" />}
            />
          )}
        </div>
      </div>
    </main>
  );
}
