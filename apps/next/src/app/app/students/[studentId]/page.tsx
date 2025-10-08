import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getStudentDetail } from './data';
import { GuardianManager } from '../../../../components/students/guardian-manager';

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
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <nav className="text-xs uppercase tracking-wide text-emerald-200/70">
          <Link href="/app/students" className="text-emerald-200 underline underline-offset-4">
            Students
          </Link>{' '}
          / <span className="text-emerald-100/70">Profile</span>
        </nav>

        <header className="flex flex-col gap-6 rounded-3xl border border-emerald-500/30 bg-emerald-900/40 p-6 shadow-inner shadow-emerald-900/40 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-emerald-300/80">Student profile</p>
            <h1 className="text-3xl font-semibold text-white">{fullName}</h1>
            <p className="text-sm text-emerald-100/70">
              Student number: <span className="font-medium text-emerald-100">{student.studentNumber ?? '—'}</span>
            </p>
            <p className="text-sm text-emerald-100/70">
              Current status: <span className="font-medium text-emerald-100">{student.status ?? 'UNKNOWN'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/app/students/${student.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-300 hover:text-white"
            >
              Edit profile
            </Link>
            <Link
              href={`/app/students/${student.id}/attendance`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-900/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-300 hover:text-white"
            >
              View attendance
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-900/30 p-6 shadow-inner shadow-emerald-900/40">
            <h2 className="text-lg font-semibold text-white">Key information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm text-emerald-100/80">
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Grade / Year</dt>
                <dd className="text-emerald-50">{student.gradeLevel ?? '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Homeroom</dt>
                <dd className="text-emerald-50">{student.homeroom ?? '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Primary language</dt>
                <dd className="text-emerald-50">{student.primaryLanguage ?? '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Date of birth</dt>
                <dd className="text-emerald-50">{formatDate(student.dateOfBirth)}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Enrollment date</dt>
                <dd className="text-emerald-50">{formatDate(student.enrollmentDate)}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Joined at Olive Tree</dt>
                <dd className="text-emerald-50">{formatDate(student.dateJoined)}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-900/30 p-6 shadow-inner shadow-emerald-900/40">
            <h2 className="text-lg font-semibold text-white">Contact & emergency</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm text-emerald-100/80">
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Email</dt>
                <dd className="break-all text-emerald-50">{student.email ?? '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Phone</dt>
                <dd className="text-emerald-50">{student.phone ?? '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Alternate phone</dt>
                <dd className="text-emerald-50">{student.alternatePhone ?? '—'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-emerald-300/80">Primary guardian</dt>
                <dd className="text-emerald-50">{primaryGuardian ? formatEmergencyContact(primaryGuardian) : 'No primary guardian on file'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-900/30 p-6 shadow-inner shadow-emerald-900/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Guardians</h2>
            </div>
            <Suspense fallback={<p className="text-sm text-emerald-100/70">Loading guardian manager…</p>}>
              <GuardianManager studentId={student.id} guardians={student.guardians} />
            </Suspense>
          </div>

          <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-900/30 p-6 shadow-inner shadow-emerald-900/40">
            <h2 className="text-lg font-semibold text-white">Admissions history</h2>
            {student.admissions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/40 p-4 text-sm text-emerald-100/70">
                No admissions records found. Once applications are submitted they will be tracked here.
              </p>
            ) : (
              <ol className="space-y-3 text-sm text-emerald-100/80">
                {student.admissions.map((admission) => (
                  <li
                    key={admission.id}
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-900/40 p-4"
                  >
                    <p className="text-emerald-200">{formatDate(admission.appliedAt)}</p>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/80">
                      Status: <span className="text-emerald-100">{admission.status}</span>
                    </p>
                    {admission.branchId ? (
                      <p className="text-xs uppercase tracking-wide text-emerald-300/60">
                        Branch: {admission.branchId}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-900/30 p-6 shadow-inner shadow-emerald-900/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Notes & support</h2>
            <Link
              href={`/app/students/${student.id}/edit#support`}
              className="rounded-full border border-emerald-500/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-300 hover:text-white"
            >
              Update notes
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/80">Support needs</h3>
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-900/40 p-4 text-sm text-emerald-100/70">
                {student.additionalSupportNotes?.trim() || 'No additional support notes recorded.'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/80">Medical notes</h3>
              <p className="rounded-2xl border border-emerald-500/30 bg-emerald-900/40 p-4 text-sm text-emerald-100/70">
                {student.medicalNotes?.trim() || 'No medical notes on file.'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300/80">General remarks</h3>
            <p className="rounded-2xl border border-emerald-500/30 bg-emerald-900/40 p-4 text-sm text-emerald-100/70">
              {student.notes?.trim() || 'No additional comments recorded.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
