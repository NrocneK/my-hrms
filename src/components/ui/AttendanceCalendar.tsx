"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  date: Date;
  checkIn:  Date | null;
  checkOut: Date | null;
  status: string;
}

interface Props {
  records:    AttendanceRecord[];
  month:      number; // 1-12
  year:       number;
  holidays?:  string[]; // array of "YYYY-MM-DD"
  onMonthChange?: (month: number, year: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PRESENT:  { label: "Có mặt",    dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700"  },
  LATE:     { label: "Đi trễ",    dot: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" },
  ABSENT:   { label: "Vắng",      dot: "bg-red-500",    bg: "bg-red-50",    text: "text-red-700"    },
  HALF_DAY: { label: "Nửa ngày",  dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-700"   },
  LEAVE:    { label: "Nghỉ phép", dot: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
};

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS   = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function fmt(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function AttendanceCalendar({ records, month, year, holidays = [], onMonthChange }: Props) {
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);

  const holidaySet = new Set(holidays);

  // Build a map: "YYYY-MM-DD" -> record
  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
    recordMap.set(key, r);
  });

  // Calendar grid
  const firstDay  = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysCount = new Date(year, month, 0).getDate();
  const today     = new Date();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (!onMonthChange) return;
    if (month === 1) onMonthChange(12, year - 1);
    else             onMonthChange(month - 1, year);
  }
  function nextMonth() {
    if (!onMonthChange) return;
    if (month === 12) onMonthChange(1, year + 1);
    else              onMonthChange(month + 1, year);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 className="font-semibold text-gray-900">{MONTHS[month - 1]} {year}</h2>
        <button onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={cn(
            "text-xs font-medium py-2",
            i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
          )}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const key    = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const record = recordMap.get(key);
          const cfg    = record ? STATUS_CONFIG[record.status] : null;
          const isHoliday = holidaySet.has(key);
          const isToday = today.getFullYear() === year &&
                          today.getMonth() + 1 === month &&
                          today.getDate() === day;
          const isWeekend = ((firstDay + day - 1) % 7 === 0) || ((firstDay + day - 1) % 7 === 6);
          const isFuture  = new Date(year, month - 1, day) > today;

          return (
            <button
              key={day}
              onClick={() => record ? setSelected(selected?.date === record.date ? null : record) : null}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg py-2 text-sm transition-all",
                isToday && "ring-2 ring-blue-500 ring-offset-1",
                cfg        ? `${cfg.bg} ${cfg.text} font-medium cursor-pointer hover:opacity-80` :
                isHoliday  ? "bg-orange-50 text-orange-600" :
                isWeekend  ? "text-gray-300" :
                isFuture   ? "text-gray-300" :
                             "text-gray-400 hover:bg-gray-50",
              )}
              title={isHoliday ? "Ngày lễ" : undefined}
            >
              <span className={cn("text-xs font-semibold", isToday && !cfg && "text-blue-600")}>
                {day}
              </span>
              {cfg && (
                <span className={cn("w-1.5 h-1.5 rounded-full mt-0.5", cfg.dot)} />
              )}
              {isHoliday && !cfg && (
                <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-orange-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Detail popup */}
      {selected && (() => {
        const cfg = STATUS_CONFIG[selected.status];
        return (
          <div className={cn("rounded-xl p-4 border", cfg.bg, "border-current border-opacity-20")}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                <span className={cn("text-sm font-semibold", cfg.text)}>{cfg.label}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(selected.date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Check-in</p>
                <p className={cn("text-base font-bold", selected.checkIn ? "text-green-600" : "text-gray-300")}>
                  {fmt(selected.checkIn)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Check-out</p>
                <p className={cn("text-base font-bold", selected.checkOut ? "text-blue-600" : "text-gray-300")}>
                  {fmt(selected.checkOut)}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-xs text-gray-500">Ngày lễ</span>
        </div>
      </div>
    </div>
  );
}
