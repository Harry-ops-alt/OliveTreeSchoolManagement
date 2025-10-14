import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStudentDetail } from '../data';
import { getStudentAttendanceHistory } from './data';
import { PageHeader } from '../../../../../components/ui/page-header';
import { Card, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

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
    <div className="space-y-6">
      <nav className="text-sm text-gray-600 dark:text-gray-400">
        <Link href="/app/students" className="text-blue-600 dark:text-blue-400 hover:underline">
          Students
        </Link>{' '}
        /{' '}
        <Link href={`/app/students/${student.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
          Profile
        </Link>{' '}
        / <span>Attendance</span>
      </nav>

      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description="Daily session history with recorded statuses and notes."
      />

      {attendance.length === 0 ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-10 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No attendance records yet. Once sessions are submitted, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attendance.map((entry) => (
            <Card
              key={entry.sessionId}
              className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
            >
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(entry.sessionDate)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.branch.name} · {entry.classSchedule?.title ?? 'Ad-hoc session'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {entry.recordStatus}
                  </Badge>
                </div>

                <dl className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Session status</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{entry.sessionStatus}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recorded at</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{formatDateTime(entry.recordedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Session notes</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{entry.sessionNotes?.trim() || '—'}</dd>
                  </div>
                </dl>

                <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Record notes</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {entry.recordNotes?.trim() || 'No additional notes recorded for this student.'}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/app/attendance/${entry.sessionId}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View session →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
