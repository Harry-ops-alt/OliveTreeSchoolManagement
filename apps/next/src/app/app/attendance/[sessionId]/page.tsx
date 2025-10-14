import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAttendanceSession } from '../data';
import { AttendanceSessionForm } from './AttendanceSessionForm';
import { PageHeader } from '../../../../components/ui/page-header';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';

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
    <div className="space-y-6">
      <Link
        href="/app/attendance"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to attendance overview
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={session.classScheduleTitle ?? 'Ad-hoc register'}
          description={`${session.branchName} · ${dateTimeFormatter.format(new Date(session.date))}`}
        />
        <Badge variant="outline" className="self-start">
          {session.status.toLowerCase()}
        </Badge>
      </div>

      {session.notes ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-900 dark:text-white">{session.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted at</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{submittedLabel}</dd>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Finalised at</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{finalisedLabel}</dd>
          </CardContent>
        </Card>
      </div>

      <form
        action={async () => {
          'use server';
          await handleRefresh(session.id);
        }}
      >
        <Button type="submit" variant="outline">
          Refresh session data
        </Button>
      </form>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student attendance</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and update learner statuses, add notes, and finalise the register when ready.
          </p>
        </div>

        <AttendanceSessionForm session={session} />
      </div>
    </div>
  );
}
