// src/app/dashboard/LogoutBtn.tsx
"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";


export default function RedirectBtn({
    page
  
}: {
    page: string;
    
}) {
    const router = useRouter();
    const onClick = async () => {
    router.push(page);
  };
  return (
 
    <button
                        onClick={onClick}

                        aria-label="Quay lại"
                        className="p-1 -ml-1 cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                    </button>
  );
}
