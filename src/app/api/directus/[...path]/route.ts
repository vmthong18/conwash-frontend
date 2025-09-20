// src/app/api/directus/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // tránh cache không mong muốn

const RAW = process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://127.0.0.1:8055";
const DIRECTUS_BASE = RAW.replace(/\/$/, "");

// Loại bỏ các hop-by-hop headers & gắn token server-side (nếu có)
function buildForwardHeaders(req: NextRequest) {
  const h = new Headers(req.headers);

  // hop-by-hop headers không nên chuyển tiếp
  [
    "host",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
  ].forEach(k => h.delete(k));

  // Nếu đã có Authorization từ client thì giữ nguyên;
  // nếu chưa có và bạn cấu hình token tĩnh, gắn token server-side
  if (!h.has("authorization") && process.env.DIRECTUS_STATIC_TOKEN) {
    h.set("authorization", `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`);
  }

  return h;
}

// ✅ Nhận trực tiếp path đã giải await
async function proxy(req: NextRequest, path: string[] = []) {
  const pathname = "/" + (path?.join("/") ?? "");
  const inUrl = new URL(req.url);
  const target = `${DIRECTUS_BASE}${pathname}${inUrl.search}`;

  const method = req.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();
  const headers = buildForwardHeaders(req);

  const upstream = await fetch(target, { method, headers, body });

  const outHeaders = new Headers(upstream.headers);
  // Proxy same-origin: không cần CORS header “lộ” ra ngoài
  outHeaders.delete("access-control-allow-origin");
  outHeaders.delete("access-control-allow-credentials");

  if (method === "HEAD") {
    return new NextResponse(null, { status: upstream.status, headers: outHeaders });
  }

  const data = await upstream.arrayBuffer();
  return new NextResponse(data, { status: upstream.status, headers: outHeaders });
}

// Kiểu context: params là Promise theo chuẩn Next 15
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;          // 👈 BẮT BUỘC await
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function HEAD(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
// (Tuỳ nhu cầu, có thể thêm OPTIONS tương tự)
