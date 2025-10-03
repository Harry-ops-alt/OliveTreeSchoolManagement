import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAttendanceSessions } from './data';
import { ATTENDANCE_STATUSES } from './types';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
});

export default async function AttendanceIndexPage() {
  const sessions = await getAttendanceSessions().catch((error) => {
    console.error('Failed to load attendance sessions', error);
    return null;
  });

  if (!sessions) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">Attendance</p>
          <h1 className="text-2xl font-semibold text-white lg:text-3xl">
            Daily attendance sessions
          </h1>
          <p className="text-sm text-emerald-100/70">
            Review recent classroom check-ins, monitor attendance status, and drill into individual
            sessions for more detail.
          </p>
        </header>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/50 p-10 text-center text-sm text-emerald-100/70">
            No attendance sessions have been recorded yet. Once teachers submit their first
            check-ins the sessions will appear here automatically.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => {
              const sessionDate = dateFormatter.format(new Date(session.date));
              const statusCounts = ATTENDANCE_STATUSES.map((status) => ({
                status,
                count: session.statusCounts?.[status] ?? 0,
              })).filter((item) => item.count > 0);

              return (
                <li
                  key={session.id}
                  className="flex h-full flex-col rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 shadow-inner shadow-emerald-500/10"
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-emerald-200/80">
                      {session.branch.name}
                    </p>
                    <h2 className="text-lg font-semibold text-white">
                      {session.classSchedule?.title ?? 'Unscheduled session'}
                    </h2>
                    <p className="text-sm text-emerald-100/70">{sessionDate}</p>
                  </div>

                  {statusCounts.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-100/80">
                      {statusCounts.map((status) => (
                        <span
                          key={`${session.id}-${status.status}`}
                          className="rounded-full bg-emerald-500/20 px-3 py-1 font-medium text-emerald-200"
                        >
                          {status.status.toLowerCase()} · {status.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-emerald-100/60">
                      No records submitted yet. Encourage the assigned teacher to complete the
                      register.
                    </p>
                  )}

                  <div className="mt-6 flex-1" />

                  <div className="mt-6 flex items-center justify-between">
                    <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-200">
                      {session.status.toLowerCase()}
                    </span>
                    <Link
                      href={`/app/attendance/${session.id}`}
                      className="text-xs font-medium text-emerald-200 underline underline-offset-4"
                    >
                      View session
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
