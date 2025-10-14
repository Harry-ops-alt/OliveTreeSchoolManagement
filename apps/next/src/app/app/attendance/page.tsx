import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAttendanceSessions } from './data';
import { ATTENDANCE_STATUSES } from './types';
import { CreateAttendanceSessionButton } from './CreateAttendanceSessionButton';
import { PageHeader } from '../../../components/ui/page-header';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

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
    <div className="space-y-6">
      <PageHeader
        title="Daily Attendance Sessions"
        description="Review recent classroom check-ins, monitor attendance status, and drill into individual sessions for more detail."
        action={<CreateAttendanceSessionButton />}
      />

      {sessions.length === 0 ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-10 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No attendance sessions have been recorded yet. Once teachers submit their first
              check-ins the sessions will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => {
            const sessionDate = dateFormatter.format(new Date(session.date));
            const statusCounts = ATTENDANCE_STATUSES.map((status) => ({
              status,
              count: session.statusCounts?.[status] ?? 0,
            })).filter((item) => item.count > 0);

            return (
              <Card
                key={session.id}
                className="flex h-full flex-col border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 hover:shadow-xl"
              >
                <CardContent className="flex h-full flex-col p-6">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {session.branch.name}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {session.classSchedule?.title ?? 'Unscheduled session'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sessionDate}</p>
                  </div>

                  {statusCounts.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {statusCounts.map((status) => (
                        <Badge
                          key={`${session.id}-${status.status}`}
                          variant="secondary"
                          className="text-xs"
                        >
                          {status.status.toLowerCase()} · {status.count}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                      No records submitted yet. Encourage the assigned teacher to complete the
                      register.
                    </p>
                  )}

                  <div className="mt-6 flex-1" />

                  <div className="mt-6 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {session.status.toLowerCase()}
                    </Badge>
                    <Link
                      href={`/app/attendance/${session.id}`}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View session →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
