// src/app/dashboard/phieuhang/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import ActionButton from "./ActionButton";
import { MapPin, ChevronDown } from "lucide-react";
import { directusFetch } from "@/lib/directusFetch";
import LogoutBtn from "@/app/dashboard/LogoutBtn";
import RedirectBtn from "@/app/dashboard/RedirectBtn";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import DiadiemSelect from './DropDownDiaDiem';
import DetailPrice from './DetailPrice';
import React, { useState } from "react";

type Search = { [k: string]: string | string[] | undefined };


const STATUS_ORDER = [
  "DANG_XU_LY",
  "SAN_SANG",
  "HOAN_THANH",
];

function parseDonhangs(raw: any): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter(Boolean);
  if (typeof raw === "string") {
    const s = raw.trim();
    // thử JSON trước
    try {
      const j = JSON.parse(s);
      if (Array.isArray(j)) return j.map(Number).filter(Boolean);
    } catch { }
    // CSV "47,48"
    return s.split(",").map(x => parseInt(x.trim(), 10)).filter(Boolean);
  }
  return [];
}

export default async function PhieuHangList({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const ddParam = (params.diadiem as string) || "";
  const jar = await cookies();
  const token = jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!token) return <div className="p-8">Chưa đăng nhập.</div>;
  const pr = (params.q as string) || "";
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Number(params.limit ?? 10);
  const offset = (page - 1) * limit;

  const API = process.env.DIRECTUS_URL!;
   const meRes = await directusFetch(
    `/users/me?fields=role.name,location,id`
  );

  let roleName = "";
  let locationid = "";
  let nameid = "";
  if (meRes.ok) {
    const me = await meRes.json();
    roleName = me?.data?.role?.name ?? "";
    locationid = me?.data?.location ?? ""
    nameid = me?.data?.id ?? ""

  }

  // Lấy danh sách phiếu
  const q = new URL(`${API}/items/phieuhang`);
  q.searchParams.set("limit", String(limit));
  q.searchParams.set("offset", String(offset));
  q.searchParams.set("sort", "-id");
  q.searchParams.set("fields", "id,ID_KhachHang,Donhangs,TongTien,TrangThai,ID_DiaDiem,ThanhToan"); // lấy đủ trường cần
  if (pr) {
    q.searchParams.set("filter[_or][0][ID_KhachHang][TenKhachHang][_contains]", pr);
    q.searchParams.set("filter[_or][1][ID_KhachHang][DienThoai][_contains]", pr);
  }
  if (ddParam) {
    q.searchParams.set("filter[ID_DiaDiem][_eq]", ddParam);
  }
  const res = await directusFetch(q.toString());
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return <div className="p-6 text-red-600">Lỗi lấy phiếu: {res.status} {t}</div>;
  }
  // Lấy danh sách địa điểm (đổ dropdown)
  const ddListURL = new URL(`${API}/items/diadiem`);
  ddListURL.searchParams.set("fields", "ID,TenDiaDiem,DiaChi");
  ddListURL.searchParams.set("limit", "-1");
  ddListURL.searchParams.set("sort", "TenDiaDiem");

  const ddListRes = await directusFetch(ddListURL.toString());
  const diadiems: Array<{ ID: number; TenDiaDiem: string; DiaChi?: string }> =
    ddListRes.ok ? (await ddListRes.json()).data ?? [] : [];

  const data = await res.json();
  const phieuRows: any[] = data?.data ?? [];

  // Lấy thông tin khách cho từng phiếu + ảnh AnhNhan của các đơn trong phiếu
  const rows = await Promise.all(phieuRows.map(async (p) => {
    // Khách
    let kh = { TenKhachHang: "-", DienThoai: "-" };
    if (p.ID_KhachHang) {
      const khRes = await directusFetch(
        `${API}/items/khachhang/${p.ID_KhachHang}?fields=TenKhachHang,DienThoai`
      );
      if (khRes.ok) kh = await khRes.json().then(j => j.data || kh);
    }

    let dd = { TenDiaDiem: "Không xác định", DiaChi: "12A Lý Nam Đế" };
    if (p.ID_DiaDiem) {
      const ddRes = await directusFetch(
        `${API}/items/diadiem/${p.ID_DiaDiem}?fields=TenDiaDiem,DiaChi`
      );
      if (ddRes.ok) dd = await ddRes.json().then(k => k.data || dd);
    }

    // Đơn trong phiếu → lấy ảnh AnhNhan
    let ids = parseDonhangs(p.Donhangs);
    let imgs: string[] = [];
    let idsgh: number[] = [];
    if (ids.length) {
      const dhURL = new URL(`${API}/items/donhang`);
      dhURL.searchParams.set("fields", "ID,AnhNhan,GoiHangs");
      dhURL.searchParams.set("filter[ID][_in]", ids.join(","));
      const dhRes = await directusFetch(dhURL.toString());
      if (dhRes.ok) {
        const dh = await dhRes.json();
        const arr: any[] = dh?.data ?? [];
        imgs = arr.map(r => r?.AnhNhan).filter(Boolean);
         idsgh = arr.map(r => r?.GoiHangs).filter(Boolean);
      }
    }

    return {
      id: p.id,
      kh,
      dd,
      imgs,
      idsgh,
      ids,                       // danh sách id ảnh
      tong: Number(p.TongTien ?? 0),
      tt: String(p.TrangThai),
      thanhtoan: p.ThanhToan,
    };
  }));

  function getNextStatus(current: string | undefined, id: string | undefined, thanhtoan: string | undefined, ids: number[]) {
    if (!current) return current;
    const idx = STATUS_ORDER.indexOf(current.trim());
    //if (idx === -1 || idx === STATUS_ORDER.length - 1) return current+"___"+idx+"___"+STATUS_ORDER.length ;
    if (thanhtoan == "0") return (
      <ActionButton id={String(id)} token={token} label="Thanh toán" ids={ids} />
    );
    if (idx == 1) return (
      <ActionButton id={String(id)} token={token} label="Hoàn thành" ids={ids} />
    );
    return "";

  }
  const hasNext = phieuRows.length === limit;
  // Danh mục gói hàng
  const goiRes = await directusFetch(
    `/items/goihang?fields=ID,TenGoi,GiaTien&limit=-1`
  );
  const goiHang = (await goiRes.json()).data ?? [];
  return (
    <main className="p-6">







      {/* Header nhẹ */}
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur">
        <div className="mx-auto max-w-sm px-4 py-3 flex items-center gap-3">
          <RedirectBtn page="/dashboard" />
          <h1 className="text-[20px] font-semibold">Danh sách đơn hàng</h1>

          <LogoutBtn />
        </div>
      </div>

      <form method="get" className="relative">

        {["Administrator"].includes(roleName)&&(
          <DiadiemSelect
          options={diadiems}
          value={ddParam}               // giá trị đang chọn
          keep={{ q: pr, limit }}       // tham số muốn giữ lại
        />

        )}
         {!["Administrator"].includes(roleName)&&(
            <div className="mx-auto max-w-sm px-4">
        <div className="rounded-2xl border bg-white p-3 shadow-sm flex items-start gap-3">
          <div className="rounded-full bg-blue-50 p-2">
            <MapPin size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium">
              {rows[0]?.dd?.TenDiaDiem || "Chưa chọn địa điểm"}
            </div>
            <div className="text-[13px] text-gray-600">
              {rows[0]?.dd?.DiaChi || "Chưa chọn địa điểm"}
              {/* Nếu có địa chỉ chi tiết thì render ở đây */}
              {/* Ví dụ: 10-16 Trần Văn Sắc, Thảo Điền, Thủ Đức, Hồ Chí Minh */}
            </div>
          </div>
          <ChevronDown size={18} className="text-gray-500" />
        </div>
      </div>

        )}

        <div className="mx-auto max-w-sm px-4">

      
          <input
            name="q"
            className="w-full rounded-2xl border border-gray-300 bg-white pl-10 pr-3 py-2.5 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm kiếm theo khách hàng, ID đơn hàng"
          />




        </div>
      </form>
      {/* Danh sách phiếu */}
      <ul className="mx-auto max-w-sm p-4 space-y-3">
        {rows.map((r) => {
          
          return (
            <li key={r.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm">
              <DetailPrice r={r} goiHang={goiHang} />

              {getNextStatus(String(r.tt), String(r.id), r.thanhtoan, r.ids)}
            </li>
          );
        })}
      </ul>

      {/* Phân trang (nếu cần) */}
      <div className="mx-auto max-w-sm px-4 pb-28">
        <div className="mt-2 flex gap-2 justify-between">
          <Link
            href={`?page=${Math.max(1, page - 1)}&limit=${limit}`}
            className="px-3 py-2 rounded-2xl border bg-white shadow-sm text-sm"
          >
            ← Trước
          </Link>
          <Link
            href={`?page=${hasNext ? page + 1 : page}&limit=${limit}`}
            className={`px-3 py-2 rounded-2xl border bg-white shadow-sm text-sm ${hasNext ? "" : "opacity-50 pointer-events-none"}`}
          >
            Sau →
          </Link>
        </div>
      </div>

      {/* Nút tạo đơn hàng (sticky đáy) */}
      <div className="sticky bottom-0 z-10 border-t bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-sm p-4">
          <Link
            href="/dashboard/phieuhang/tao"
            className="block w-full text-center rounded-2xl bg-blue-600 py-3 text-white font-medium"
          >
            Tạo đơn hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
