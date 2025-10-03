import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAttendanceSession } from '../data';
import { AttendanceSessionForm } from './AttendanceSessionForm';

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'short',
});

async function handleRefresh(sessionId: string) {
  'use server';
  revalidatePath(`/app/attendance/${sessionId}`);
}

export default async function AttendanceSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const session = await getAttendanceSession(params.sessionId);

  if (!session) {
    notFound();
  }

  const submittedLabel = session.submittedAt
    ? dateTimeFormatter.format(new Date(session.submittedAt))
    : 'Not yet submitted';
  const finalisedLabel = session.finalizedAt
    ? dateTimeFormatter.format(new Date(session.finalizedAt))
    : 'Not yet finalised';

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <Link
          href="/app/attendance"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-200 underline underline-offset-4"
        >
          ← Back to attendance overview
        </Link>

        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-300/80">Attendance session</p>
              <h1 className="text-3xl font-semibold text-white">
                {session.classScheduleTitle ?? 'Ad-hoc register'}
              </h1>
              <p className="mt-2 text-sm text-emerald-100/70">
                {session.branchName} · {dateTimeFormatter.format(new Date(session.date))}
              </p>
            </div>
            <span className="self-start rounded-full bg-emerald-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              {session.status.toLowerCase()}
            </span>
          </div>

          {session.notes ? (
            <p className="rounded-2xl border border-emerald-500/30 bg-emerald-900/70 p-4 text-sm text-emerald-100/80">
              {session.notes}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <dl className="rounded-2xl border border-emerald-500/30 bg-emerald-900/70 p-4 text-sm text-emerald-100/80">
              <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Submitted at</dt>
              <dd className="mt-1 text-emerald-50">{submittedLabel}</dd>
            </dl>
            <dl className="rounded-2xl border border-emerald-500/30 bg-emerald-900/70 p-4 text-sm text-emerald-100/80">
              <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Finalised at</dt>
              <dd className="mt-1 text-emerald-50">{finalisedLabel}</dd>
            </dl>
          </div>
        </header>

        <form
          action={async () => {
            'use server';
            await handleRefresh(session.id);
          }}
        >
          <button
            type="submit"
            className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
          >
            Refresh session data
          </button>
        </form>

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Student attendance</h2>
            <p className="text-sm text-emerald-100/70">
              Review and update learner statuses, add notes, and finalise the register when ready.
            </p>
          </div>

          <AttendanceSessionForm session={session} />
        </section>
      </div>
    </div>
  );
}
