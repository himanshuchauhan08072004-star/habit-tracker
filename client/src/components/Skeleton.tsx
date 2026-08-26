function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />;
}

export function HabitCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <Shimmer className="h-4 w-1/3" />
      <Shimmer className="mt-2 h-3 w-2/3" />
      <Shimmer className="mt-4 h-3 w-1/2" />
      <Shimmer className="mt-4 h-9 w-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <Shimmer className="h-7 w-7 rounded-md" />
      <Shimmer className="mt-3 h-6 w-16" />
      <Shimmer className="mt-2 h-3 w-20" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <HabitCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
