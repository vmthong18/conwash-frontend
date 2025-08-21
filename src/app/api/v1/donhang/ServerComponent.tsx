// src/app/api/v1/donhang/ServerComponent.tsx
import { cookies } from "next/headers";

export async function getAccess() {
  const jar = await cookies(); // Sử dụng await để lấy cookie
  return jar.get(process.env.COOKIE_ACCESS || "be_giay_access")?.value;
}
