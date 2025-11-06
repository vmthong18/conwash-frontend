'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';

type Option = { ID: number | string; TenDiaDiem: string; DiaChi?: string };

export default function DiadiemSelect({
  options,
  value = '',
  keep,
}: {
  options: Option[];
  value?: string;
  // các tham số muốn giữ lại khi đổi địa điểm (q, limit, v.v.)
  keep?: Record<string, string | number | undefined | null>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = new URLSearchParams(searchParams.toString());
    const v = e.target.value;

    if (v) p.set('diadiem', v);
    else p.delete('diadiem');

    // giữ lại tham số khác nếu truyền vào
    if (keep) {
      Object.entries(keep).forEach(([k, val]) => {
        if (val === undefined || val === null || val === '') p.delete(k);
        else p.set(k, String(val));
      });
    }

    // reset về trang 1 khi đổi bộ lọc
    p.set('page', '1');

    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="mx-auto max-w-sm px-4">
      <div className="relative rounded-2xl border bg-white shadow-sm">
        {/* Icon trái */}
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-blue-50 p-2">
          <MapPin size={18} className="text-blue-600" />
        </div>

        {/* Dropdown giữ nguyên cảm giác CSS */}
        <select
          name="diadiem"
          value={value}
          onChange={handleChange}
          className="w-full appearance-none rounded-2xl pl-14 pr-9 py-3 text-[14px] leading-5
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
    
          {options.map((d) => (
            <option key={d.ID} value={String(d.ID)}>
              {d.TenDiaDiem}
            </option>
          ))}
        </select>

        {/* Chevron phải */}
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </div>
    </div>
  );
}
