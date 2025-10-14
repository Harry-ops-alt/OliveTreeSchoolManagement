export default function AppLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-64 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full max-w-2xl rounded bg-gray-100 dark:bg-gray-800" />
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-xl border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
          />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-xl border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-56 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 rounded-xl border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
              />
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-4 animate-pulse">
        <div className="h-6 w-52 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-72 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-xl border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
