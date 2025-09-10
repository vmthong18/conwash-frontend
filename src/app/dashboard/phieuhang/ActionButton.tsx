"use client";

export default function ActionButton({ id,token,label}: { id: string,token:string|undefined, label: string }) {
    async function onSubmit(id: string | undefined) {
    try{
        const api = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS;
          if (!api) throw new Error("Thiếu cấu hình DIRECTUS_URL / NEXT_PUBLIC_DIRECTUS_URL.");
        const res = await fetch(`${api}/items/phieuhang/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    TrangThai:"HOAN_THANH",
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                const msg =
                    data?.errors?.[0]?.message ||
                    data?.error ||
                    "Không tạo được đơn";
                throw new Error(msg);
            }
    }
    catch(e:any){
        alert(`Lỗi: ${e.message || e.toString()}`);
    } 
  }
  return (
    <button
      onClick={() => onSubmit(id)}
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {label}
    </button>
  );
}
