// src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { directusFetch } from "@/lib/directusFetch";

export async function POST(req: NextRequest) {
  const token = (await cookies()).get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
  if (!token) return new Response(JSON.stringify({ ok: false, error: "Unauthenticated" }), { status: 401, headers: { Location: "/login" } });

  const form = await req.formData();
  const file = form.get("file");
  const folder = form.get("folder")?.toString();
  if (!(file instanceof Blob)) return new Response(JSON.stringify({ ok: false, error: "No file" }), { status: 400 });

  const fd = new FormData();
  if (folder)
    {
       fd.append("folder", folder);
    }
    else
    {

       fd.append("folder", '5c8abeb5-07c0-4ffb-83b4-788a1e33af0d');
    }
  fd.append("file", file, (file as any).name || "upload.bin");
  
  //return new Response(JSON.stringify({ ok: false, error: folder?.toString()}), { status: 401, headers: { Location: "/login" } });
  
  const up = await directusFetch(`${process.env.DIRECTUS_URL}/files`, {
    method: "POST",
    body: fd,
  });

  const text = await up.text(); // <-- lấy raw để debug

  if (!up.ok) {
    console.error("UPLOAD /files FAILED:", up.status, text);
    return new Response(JSON.stringify({ ok: false, error: `/files ${up.status}: ${text}` }), { status: up.status });
  }

  try {
    const ujson = JSON.parse(text);
    return new Response(JSON.stringify({ ok: true, id: ujson?.data?.id }), { status: 200 });
  } catch {
    console.error("UPLOAD PARSE FAILED:", text);
    return new Response(JSON.stringify({ ok: false, error: "Upload parse failed" }), { status: 500 });
  }
}
