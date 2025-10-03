import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '../../lib/api-client';
import { ATTENDANCE_STATUSES } from './attendance/types';
import type { AttendanceSessionSummary } from './attendance/types';
import { getAttendanceSessions } from './attendance/data';

type DashboardSummary = {
  students: number;
  teachers: number;
  admissionsPending: number;
  finance: Record<'INVOICE' | 'PAYMENT' | 'REFUND' | 'EXPENSE', string>;
};

type DashboardAdmissionItem = {
  id: string;
  studentName: string;
  status: string;
  branchName: string;
  appliedAt: string;
};

type DashboardFinanceItem = {
  id: string;
  type: string;
  amount: string;
  occurredAt: string;
  branchName: string;
};

type MetricDefinition = {
  title: string;
  description: string;
  value: string;
};

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
});

async function fetchDashboardData<T>(path: string): Promise<T> {
  const response = await apiFetch(path);

  if (!response.ok) {
    throw new Error(`Dashboard request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function toTitle(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

const fallbackMetrics: MetricDefinition[] = [
  {
    title: 'Enrolled students',
    description: 'Active learners across branches',
    value: '0',
  },
  {
    title: 'Teaching staff',
    description: 'Teachers currently on the roster',
    value: '0',
  },
  {
    title: 'Open admissions',
    description: 'Applications awaiting a decision',
    value: '0',
  },
  {
    title: 'MTD net revenue',
    description: 'Payments minus expenses this month',
    value: currencyFormatter.format(0),
  },
];

const metricTestIds: Record<string, string> = {
  'Enrolled students': 'metric-students',
  'Teaching staff': 'metric-teachers',
  'Open admissions': 'metric-open-admissions',
  'MTD net revenue': 'metric-net-revenue',
};

async function handleRefresh() {
  'use server';
  revalidatePath('/app');
}

export default async function AppDashboard() {
  const [summaryResult, admissionsResult, financeResult, attendanceResult] = await Promise.allSettled([
    fetchDashboardData<DashboardSummary>('/dashboard/summary'),
    fetchDashboardData<DashboardAdmissionItem[]>('/dashboard/admissions/recent'),
    fetchDashboardData<DashboardFinanceItem[]>('/dashboard/finance/recent'),
    getAttendanceSessions(),
  ]);

  let summary: DashboardSummary | null = null;
  let admissions: DashboardAdmissionItem[] = [];
  let finance: DashboardFinanceItem[] = [];
  let attendanceSessions: AttendanceSessionSummary[] = [];

  let dataLoadFailed = false;

  if (summaryResult.status === 'fulfilled') {
    summary = summaryResult.value;
  } else {
    console.error('Failed to load dashboard summary', summaryResult.reason);
    dataLoadFailed = true;
  }

  if (admissionsResult.status === 'fulfilled') {
    admissions = admissionsResult.value;
  } else {
    console.error('Failed to load recent admissions', admissionsResult.reason);
    dataLoadFailed = true;
  }

  if (financeResult.status === 'fulfilled') {
    finance = financeResult.value;
  } else {
    console.error('Failed to load finance data', financeResult.reason);
    dataLoadFailed = true;
  }

  if (attendanceResult.status === 'fulfilled') {
    attendanceSessions = attendanceResult.value;
  } else {
    console.warn('Failed to load attendance sessions', attendanceResult.reason);
  }

  const metrics: MetricDefinition[] = summary
    ? [
        {
          title: 'Enrolled students',
          description: 'Active learners across branches',
          value: summary.students.toLocaleString('en-GB'),
        },
        {
          title: 'Teaching staff',
          description: 'Teachers currently on the roster',
          value: summary.teachers.toLocaleString('en-GB'),
        },
        {
          title: 'Open admissions',
          description: 'Applications awaiting a decision',
          value: summary.admissionsPending.toLocaleString('en-GB'),
        },
        {
          title: 'MTD net revenue',
          description: 'Payments minus expenses this month',
          value: currencyFormatter.format(
            parseFloat(summary.finance.PAYMENT ?? '0') -
              parseFloat(summary.finance.EXPENSE ?? '0'),
          ),
        },
      ]
    : fallbackMetrics;

  const admissionsItems = admissions.map((item) => ({
    ...item,
    statusLabel: toTitle(item.status),
    appliedDisplay: dateFormatter.format(new Date(item.appliedAt)),
  }));

  const financeItems = finance.map((item) => ({
    ...item,
    typeLabel: toTitle(item.type),
    amountDisplay: currencyFormatter.format(parseFloat(item.amount ?? '0')),
    occurredDisplay: dateFormatter.format(new Date(item.occurredAt)),
  }));

  const admissionsBadge = admissionsItems.length > 0 ? 'Updated' : 'Live soon';
  const financeBadge = financeItems.length > 0 ? 'Updated' : 'Live soon';

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        <header className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-300/80">Dashboard</p>
              <h1 className="text-3xl font-semibold lg:text-4xl">Welcome to Olive Tree Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm text-emerald-100/80">
                Monitor admissions, enrolment, finance, and daily operations in one place. The
                data below reflects the latest information from the Olive Tree API.
              </p>
            </div>
          </div>
        </header>

        {dataLoadFailed ? (
          <form action={handleRefresh} className="rounded-2xl border border-emerald-500/40 bg-emerald-900/70 p-5 text-sm text-emerald-100/80">
            <p>
              We had trouble loading the latest metrics. Showing the most recent cached values where
              available.
            </p>
            <button
              type="submit"
              className="mt-4 rounded-full border border-emerald-500/60 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
            >
              Try again
            </button>
          </form>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.title}
              className="rounded-2xl border border-emerald-500/40 bg-emerald-900/70 p-5 shadow-inner shadow-emerald-500/10"
            >
              <p className="text-sm text-emerald-200/80">{metric.title}</p>
              <p
                className="mt-4 text-3xl font-semibold text-white"
                data-testid={metricTestIds[metric.title] ?? undefined}
              >
                {metric.value}
              </p>
              <p className="mt-3 text-xs text-emerald-100/70">{metric.description}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 shadow-inner shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-white">Recent admissions</h2>
                <p className="text-sm text-emerald-100/70">Latest applications across branches.</p>
              </div>
              <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200/80">
                {admissionsBadge}
              </span>
            </div>

            {admissionsItems.length === 0 ? (
              <p className="mt-8 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-950/40 p-6 text-sm text-emerald-100/60">
                Admission updates will appear here as soon as applicants start flowing through the
                system.
              </p>
            ) : (
              <ul className="mt-6 space-y-4" data-testid="admissions-list">
                {admissionsItems.map((admission) => (
                  <li
                    key={admission.id}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4"
                    data-testid="admissions-item"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{admission.studentName}</p>
                        <p className="text-xs text-emerald-100/70">{admission.branchName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
                        {admission.statusLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-emerald-100/60">
                      Applied {admission.appliedDisplay}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 shadow-inner shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-white">Finance snapshot</h2>
                <p className="text-sm text-emerald-100/70">Track payments, invoices, and expenses.</p>
              </div>
              <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200/80">
                {financeBadge}
              </span>
            </div>

            {financeItems.length === 0 ? (
              <p className="mt-8 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-950/40 p-6 text-sm text-emerald-100/60">
                Finance activity from the past week will display here once payments or expenses are
                recorded.
              </p>
            ) : (
              <ul className="mt-6 space-y-4" data-testid="finance-list">
                {financeItems.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4"
                    data-testid="finance-item"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{transaction.typeLabel}</p>
                        <p className="text-xs text-emerald-100/70">{transaction.branchName}</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-200">
                        {transaction.amountDisplay}
                      </p>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-emerald-100/60">
                      Logged {transaction.occurredDisplay}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-emerald-500/40 bg-emerald-900/50 p-6 shadow-inner shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Attendance overview</h2>
              <p className="text-sm text-emerald-100/70">
                Track recent sessions, status counts, and follow-up actions.
              </p>
            </div>
            <Link
              href="/app/attendance"
              className="text-xs font-medium text-emerald-200 underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          {attendanceSessions.length === 0 ? (
            <p className="mt-8 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-950/40 p-6 text-sm text-emerald-100/60">
              Attendance sessions will appear here once teachers begin recording daily check-ins.
            </p>
          ) : (
            <ul className="mt-6 space-y-4" data-testid="attendance-list">
              {attendanceSessions.slice(0, 3).map((session) => {
                const sessionDate = dateFormatter.format(new Date(session.date));
                const statusCounts = ATTENDANCE_STATUSES.map((status) => ({
                  status,
                  count: session.statusCounts?.[status] ?? 0,
                })).filter((item) => item.count > 0);

                return (
                  <li
                    key={session.id}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4"
                    data-testid="attendance-item"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-emerald-200/80">
                          {session.branch.name}
                        </p>
                        <h3 className="text-lg font-semibold text-white">
                          {session.classSchedule?.title ?? 'Unscheduled session'}
                        </h3>
                        <p className="text-xs text-emerald-100/70">{sessionDate}</p>
                      </div>
                      <Link
                        href={`/app/attendance/${session.id}`}
                        className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                      >
                        View details
                      </Link>
                    </div>

                    {statusCounts.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-100/80">
                        {statusCounts.map((status) => (
                          <span
                            key={`${session.id}-${status.status}`}
                            className="rounded-full bg-emerald-500/20 px-3 py-1 font-medium text-emerald-200"
                            data-testid={`attendance-status-${status.status.toLowerCase()}`}
                          >
                            {status.status.toLowerCase()} · {status.count}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-emerald-100/60">
                        No attendance records yet. Encourage staff to complete check-in.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-emerald-500/40 bg-emerald-900/50 p-6 shadow-inner shadow-emerald-500/10">
          <h2 className="text-lg font-medium text-white">Quick actions</h2>
          <p className="mt-2 text-sm text-emerald-100/70">
            Get a head start on the most common workflows. These links will point to the relevant
            modules once they are ready.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Create student profile', href: '#' },
              { label: 'Review admissions queue', href: '#' },
              { label: 'Record attendance', href: '/app/attendance' },
              { label: 'Schedule parent meeting', href: '#' },
              { label: 'Add finance transaction', href: '#' },
              { label: 'Publish announcement', href: '#' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/60 px-4 py-3 text-left text-sm text-emerald-100/80 transition hover:border-emerald-400 hover:text-white"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
