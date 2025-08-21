import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS = process.env.COOKIE_ACCESS || "be_giay_access";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const access = req.cookies.get(ACCESS)?.value;
    if (!access) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
