// app/api/directus/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_BASE = process.env.DIRECTUS_INTERNAL_URL || 'http://127.0.0.1:8055';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function OPTIONS(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = '/' + (params.path?.join('/') ?? '');
  const url = new URL(req.url);
  const target = `${DIRECTUS_BASE}${path}${url.search}`;

  // Sao chép body (nếu có)
  const body = ['GET','HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

  // Chuẩn bị headers chuyển tiếp (loại bỏ các header đặc thù)
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');

  // Nếu dùng token server-side, gắn ở đây (tránh để lộ cho client)
  if (process.env.DIRECTUS_STATIC_TOKEN) {
    headers.set('Authorization', `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`);
  }

  const resp = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  // Chuyển tiếp response
  const respHeaders = new Headers(resp.headers);
  // Đảm bảo same-origin cho browser: không để CORS header “lộ” ra ngoài
  respHeaders.delete('access-control-allow-origin');
  respHeaders.delete('access-control-allow-credentials');
  respHeaders.set('Vary', ''); // tránh cache sai theo Origin

  const data = await resp.arrayBuffer();
  return new NextResponse(data, { status: resp.status, headers: respHeaders });
}
