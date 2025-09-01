import Image from "next/image";
import { redirect, notFound } from "next/navigation";

export default function Home() {
   redirect(`/login`); 
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Front Giày</h1>
      <p className="mt-2">Đăng nhập để xem dữ liệu từ BackEndGiay.</p>
    </main>
  );
}
