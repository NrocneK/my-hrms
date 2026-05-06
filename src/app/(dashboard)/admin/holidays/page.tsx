import { getHolidays }       from "@/actions/holiday.action";
import { HolidayManager }    from "@/components/forms/HolidayManager";

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp   = await searchParams;
  const year = Number(sp.year) || new Date().getFullYear();
  const holidays = await getHolidays(year);

  const years = [year - 1, year, year + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch ngày lễ</h1>
          <p className="text-sm text-gray-400 mt-1">
            Ngày lễ được tính là ngày nghỉ có hưởng lương, không ảnh hưởng chấm công
          </p>
        </div>
        <div className="flex items-center gap-2">
          {years.map(y => (
            <a key={y} href={`?year=${y}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors
                ${y === year
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {y}
            </a>
          ))}
        </div>
      </div>

      <HolidayManager holidays={holidays} year={year} />
    </div>
  );
}
