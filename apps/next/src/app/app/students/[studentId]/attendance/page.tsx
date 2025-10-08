import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStudentDetail } from '../data';
import { getStudentAttendanceHistory } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateFormatter.format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return dateTimeFormatter.format(date);
}

export default async function StudentAttendancePage({ params }: { params: { studentId: string } }) {
  const [student, attendance] = await Promise.all([
    getStudentDetail(params.studentId),
    getStudentAttendanceHistory(params.studentId),
  ]);

  if (!student) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <nav className="text-xs uppercase tracking-wide text-emerald-200/70">
          <Link href="/app/students" className="text-emerald-200 underline underline-offset-4">
            Students
          </Link>{' '}
          /{' '}
          <Link href={`/app/students/${student.id}`} className="text-emerald-200 underline underline-offset-4">
            Profile
          </Link>{' '}
          / <span className="text-emerald-100/70">Attendance</span>
        </nav>

        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">Attendance</p>
          <h1 className="text-3xl font-semibold text-white">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-sm text-emerald-100/70">Daily session history with recorded statuses and notes.</p>
        </header>

        {attendance.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-emerald-500/40 bg-emerald-900/30 p-6 text-sm text-emerald-100/70">
            No attendance records yet. Once sessions are submitted, they will appear here.
          </div>
        ) : (
          <ul className="space-y-4">
            {attendance.map((entry) => (
              <li
                key={entry.sessionId}
                className="rounded-3xl border border-emerald-500/30 bg-emerald-900/40 p-5 shadow-inner shadow-emerald-900/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{formatDate(entry.sessionDate)}</p>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/80">
                      {entry.branch.name} · {entry.classSchedule?.title ?? 'Ad-hoc session'}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                    {entry.recordStatus}
                  </span>
                </div>

                <dl className="mt-4 grid gap-3 text-xs text-emerald-100/80 md:grid-cols-3">
                  <div>
                    <dt className="text-emerald-300/80">Session status</dt>
                    <dd className="text-emerald-50">{entry.sessionStatus}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-300/80">Recorded at</dt>
                    <dd className="text-emerald-50">{formatDateTime(entry.recordedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-300/80">Session notes</dt>
                    <dd className="text-emerald-50">{entry.sessionNotes?.trim() || '—'}</dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-900/50 p-4 text-sm text-emerald-100/80">
                  <h3 className="text-xs uppercase tracking-wide text-emerald-300/80">Record notes</h3>
                  <p className="mt-1">
                    {entry.recordNotes?.trim() || 'No additional notes recorded for this student.'}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/app/attendance/${entry.sessionId}`}
                    className="text-xs font-semibold uppercase tracking-wide text-emerald-200 underline underline-offset-4 hover:text-emerald-100"
                  >
                    View session
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
