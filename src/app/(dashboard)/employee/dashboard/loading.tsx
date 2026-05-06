export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-8 bg-gray-200 rounded" />
              <div className="h-5 w-28 bg-gray-200 rounded" />
              <div className="h-5 w-8 bg-gray-200 rounded" />
            </div>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded" />
              ))}
            </div>
            {/* Calendar days */}
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="grid grid-cols-7 gap-1 mb-1">
                {Array.from({ length: 7 }).map((_, col) => (
                  <div key={col} className="h-10 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ))}
          </div>

          {/* Check-in skeleton */}
          <div className="card p-5">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 bg-gray-100 rounded-xl" />
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-3 w-12 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
