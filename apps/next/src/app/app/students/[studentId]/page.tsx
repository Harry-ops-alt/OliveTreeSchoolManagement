import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getStudentDetail } from './data';
import { GuardianManager } from '../../../../components/students/guardian-manager';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
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

function formatName(firstName: string | null, lastName: string | null): string {
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return name || 'Unnamed student';
}

function formatEmergencyContact(guardian: {
  guardian: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}): string {
  if (!guardian.guardian) {
    return 'No primary guardian on file';
  }

  const name = `${guardian.guardian.firstName ?? ''} ${guardian.guardian.lastName ?? ''}`.trim();
  const phone = guardian.guardian.phone ?? '—';
  const email = guardian.guardian.email ?? '—';
  return `${name || 'Guardian'} · ${phone} · ${email}`;
}

export default async function StudentProfilePage({ params }: { params: { studentId: string } }) {
  const student = await getStudentDetail(params.studentId);

  if (!student) {
    notFound();
  }

  const fullName = formatName(student.firstName, student.lastName);
  const primaryGuardian = student.guardians.find((guardian) => guardian.isPrimary);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-600 dark:text-gray-400">
        <Link href="/app/students" className="text-blue-600 dark:text-blue-400 hover:underline">
          Students
        </Link>{' '}
        / <span>Profile</span>
      </nav>

      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Student profile</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student number: <span className="font-medium text-gray-900 dark:text-white">{student.studentNumber ?? '—'}</span>
              </p>
              <Badge variant="outline">{student.status ?? 'UNKNOWN'}</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/app/students/${student.id}/edit`}>
                <Button variant="default">Edit profile</Button>
              </Link>
              <Link href={`/app/students/${student.id}/attendance`}>
                <Button variant="outline">View attendance</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle>Key information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Grade / Year</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{student.gradeLevel ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Homeroom</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{student.homeroom ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary language</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{student.primaryLanguage ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of birth</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{formatDate(student.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrollment date</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{formatDate(student.enrollmentDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined at Olive Tree</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{formatDate(student.dateJoined)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle>Contact & emergency</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 break-all text-gray-900 dark:text-white">{student.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{student.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Alternate phone</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{student.alternatePhone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary guardian</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{primaryGuardian ? formatEmergencyContact(primaryGuardian) : 'No primary guardian on file'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle>Guardians</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-gray-600 dark:text-gray-400">Loading guardian manager…</p>}>
              <GuardianManager studentId={student.id} guardians={student.guardians} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle>Admissions history</CardTitle>
          </CardHeader>
          <CardContent>
            {student.admissions.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No admissions records found. Once applications are submitted they will be tracked here.
              </p>
            ) : (
              <ol className="space-y-3">
                {student.admissions.map((admission) => (
                  <li
                    key={admission.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(admission.appliedAt)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <Badge variant="outline">{admission.status}</Badge>
                    </p>
                    {admission.branchId ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Branch: {admission.branchId}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notes & support</CardTitle>
            <Link href={`/app/students/${student.id}/edit#support`}>
              <Button variant="outline" size="sm">Update notes</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Support needs</h3>
              <p className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-600 dark:text-gray-400">
                {student.additionalSupportNotes?.trim() || 'No additional support notes recorded.'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Medical notes</h3>
              <p className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-600 dark:text-gray-400">
                {student.medicalNotes?.trim() || 'No medical notes on file.'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">General remarks</h3>
            <p className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-600 dark:text-gray-400">
              {student.notes?.trim() || 'No additional comments recorded.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
