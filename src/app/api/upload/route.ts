// src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const token = (await cookies()).get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!token) return new Response(JSON.stringify({ ok:false, error:"Unauthenticated" }), { status:401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) return new Response(JSON.stringify({ ok:false, error:"No file" }), { status:400 });

  const fd = new FormData();
  fd.append("file", file, (file as any).name || "upload.bin");

  const up = await fetch(`${process.env.DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const text = await up.text(); // <-- lấy raw để debug
  if (!up.ok) {
    console.error("UPLOAD /files FAILED:", up.status, text);
    return new Response(JSON.stringify({ ok:false, error:`/files ${up.status}: ${text}` }), { status:up.status });
  }

  try {
    const ujson = JSON.parse(text);
    return new Response(JSON.stringify({ ok:true, id: ujson?.data?.id }), { status:200 });
  } catch {
    console.error("UPLOAD PARSE FAILED:", text);
    return new Response(JSON.stringify({ ok:false, error:"Upload parse failed" }), { status:500 });
  }
}
