export function AdmissionsCardsSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-emerald-500/30 bg-emerald-900/40 p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-emerald-800/50" />
              <div className="h-3 w-24 rounded bg-emerald-800/40" />
            </div>
            <div className="h-6 w-20 rounded-full bg-emerald-800/40" />
          </div>
          <div className="mt-5 h-3 w-32 rounded bg-emerald-800/40" />
        </div>
      ))}
    </div>
  );
}
