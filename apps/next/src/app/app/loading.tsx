export default function AppLoading() {
  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        <header className="space-y-4 animate-pulse">
          <div className="h-6 w-32 rounded bg-emerald-800/60" />
          <div className="h-10 w-64 rounded bg-emerald-800/60" />
          <div className="h-4 w-full max-w-2xl rounded bg-emerald-800/40" />
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-emerald-500/20 bg-emerald-900/50"
            />
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-40 rounded bg-emerald-800/60" />
            <div className="h-4 w-64 rounded bg-emerald-800/40" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-xl border border-emerald-500/20 bg-emerald-900/50"
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-48 rounded bg-emerald-800/60" />
            <div className="h-4 w-56 rounded bg-emerald-800/40" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-xl border border-emerald-500/20 bg-emerald-900/50"
                />
              ))}
            </div>
          </div>
        </div>

        <section className="space-y-4 animate-pulse">
          <div className="h-6 w-52 rounded bg-emerald-800/60" />
          <div className="h-4 w-72 rounded bg-emerald-800/40" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-xl border border-emerald-500/20 bg-emerald-900/50"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
