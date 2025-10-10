// src/app/api/v1/location/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import router from "next/router";


/**
 * PATCH Location cho user hiện tại ở bảng directus_users
 * Yêu cầu: token trong cookie, và role có quyền update trường Location của users.me
 */
export async function POST(req: Request) {
  try {
    const jar = await cookies();
    const token =
      jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;

    if (!token) {
        router.push('/login');
     /* return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );*/
    }

    // const form = await req.formData();
    //const locationIdRaw = form.get("locationId");
    //const locationId = Number(locationIdRaw);
    const b = await req.json();
    const locationId = b?.id;
    if (!locationId || Number.isNaN(locationId)) {
      return NextResponse.json(
        { ok: false, error: "Thiếu hoặc sai locationId" },
        { status: 400 }
      );
    }

    const base = process.env.DIRECTUS_URL!;
    const field =
      process.env.DIRECTUS_USER_LOCATION_FIELD || "location"; // tên cột trong directus_users

    const res = await fetch(`${base}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [field]: locationId }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.errors?.[0]?.message || "Cập nhật thất bại" },
        { status: 400 }
      );
    }
    const fe = process.env.NEXT_PUBLIC_APP_URL!;
    // Thành công: quay lại danh sách (hoặc trả JSON nếu bạn muốn gọi fetch client)
   return NextResponse.json({ ok: true, created: true, kh: data?.data });
    //return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
