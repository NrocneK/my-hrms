"use client";

import { useRouter, useSearchParams } from "next/navigation";

const MONTH_NAMES = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                        "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export function MonthPicker({
  currentMonth,
  currentYear,
}: {
  currentMonth: number;
  currentYear:  number;
}) {
  const router     = useRouter();
  const now        = new Date(Date.now() + 7 * 3600000);
  const nowMonth   = now.getUTCMonth() + 1;
  const nowYear    = now.getUTCFullYear();

  // Tạo 12 tháng gần nhất
  const options = Array.from({ length: 12 }, (_, i) => {
    let m = nowMonth - i;
    let y = nowYear;
    if (m <= 0) { m += 12; y--; }
    return { m, y, label: `${MONTH_NAMES[m]} ${y}`, value: `${m}-${y}` };
  });

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [m, y] = e.target.value.split("-");
    router.push(`?month=${m}&year=${y}`);
  }

  return (
    <select
      className="input w-auto text-sm"
      defaultValue={`${currentMonth}-${currentYear}`}
      onChange={handleChange}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
