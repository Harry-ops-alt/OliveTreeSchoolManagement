import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { Users, GraduationCap, FileText, TrendingUp, Clock, DollarSign, AlertCircle, AlertTriangle, UserX, CreditCard } from 'lucide-react';
import { apiFetch } from '../../lib/api-client';
import { ATTENDANCE_STATUSES } from './attendance/types';
import type { AttendanceSessionSummary } from './attendance/types';
import { getAttendanceSessions } from './attendance/data';
import { PageHeader } from '../../components/ui/page-header';
import { StatsCard } from '../../components/ui/stats-card';
import { AlertCard } from '../../components/ui/alert-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

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
    <div className="space-y-8">
      <PageHeader
        title="Analytics Overview"
        description="Executive dashboard with predictive insights and revenue tracking"
      />

      {dataLoadFailed ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  We had trouble loading the latest metrics
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showing the most recent cached values where available.
                </p>
                <form action={handleRefresh} className="mt-4">
                  <Button type="submit" variant="outline" size="sm">
                    Try again
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={metrics[0].value}
          icon={Users}
          variant="primary"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Onboarded %"
          value="75%"
          icon={GraduationCap}
          variant="success"
          trend={{ value: 6.2, isPositive: true }}
        />
        <StatsCard
          title="Verified %"
          value="68%"
          icon={FileText}
          variant="warning"
          trend={{ value: 3.1, isPositive: true }}
        />
        <StatsCard
          title="Churn Rate (30d)"
          value="4.8%"
          icon={TrendingUp}
          variant="error"
          trend={{ value: 1.2, isPositive: false }}
        />
      </div>

      {/* Live Alerts Section - Analytics Hub Style */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" />
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Live Alerts</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <AlertCard
            icon={AlertCircle}
            title="At Risk of Churn"
            count={67}
            variant="error"
          />
          <AlertCard
            icon={UserX}
            title="Onboarded But Not Subscribed"
            count={124}
            variant="warning"
          />
          <AlertCard
            icon={CreditCard}
            title="Recently Cancelled"
            count={23}
            variant="warning"
          />
          <AlertCard
            icon={Clock}
            title="Trials Ending Soon"
            count={45}
            variant="info"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold tracking-tight">Recent Admissions</CardTitle>
                <CardDescription className="text-xs">Latest applications across branches</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">{admissionsBadge}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {admissionsItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Admission updates will appear here as soon as applicants start flowing through the system.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" data-testid="admissions-list">
                {admissionsItems.map((admission) => (
                  <li
                    key={admission.id}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                    data-testid="admissions-item"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{admission.studentName}</p>
                        <p className="text-xs text-muted-foreground">{admission.branchName}</p>
                      </div>
                      <Badge variant="secondary">{admission.statusLabel}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Applied {admission.appliedDisplay}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold tracking-tight">Finance Snapshot</CardTitle>
                <CardDescription className="text-xs">Track payments, invoices, and expenses</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-medium">{financeBadge}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {financeItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Finance activity from the past week will display here once payments or expenses are recorded.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" data-testid="finance-list">
                {financeItems.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                    data-testid="finance-item"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{transaction.typeLabel}</p>
                        <p className="text-xs text-muted-foreground">{transaction.branchName}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {transaction.amountDisplay}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Logged {transaction.occurredDisplay}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>
                Track recent sessions, status counts, and follow-up actions
              </CardDescription>
            </div>
            <Link href="/app/attendance">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Attendance sessions will appear here once teachers begin recording daily check-ins.
              </p>
            </div>
          ) : (
            <ul className="space-y-3" data-testid="attendance-list">
              {attendanceSessions.slice(0, 3).map((session) => {
                const sessionDate = dateFormatter.format(new Date(session.date));
                const statusCounts = ATTENDANCE_STATUSES.map((status) => ({
                  status,
                  count: session.statusCounts?.[status] ?? 0,
                })).filter((item) => item.count > 0);

                return (
                  <li
                    key={session.id}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                    data-testid="attendance-item"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {session.branch.name}
                        </p>
                        <h3 className="text-base font-semibold text-foreground">
                          {session.classSchedule?.title ?? 'Unscheduled session'}
                        </h3>
                        <p className="text-xs text-muted-foreground">{sessionDate}</p>
                      </div>
                      <Link href={`/app/attendance/${session.id}`}>
                        <Button variant="outline" size="sm">
                          View details
                        </Button>
                      </Link>
                    </div>

                    {statusCounts.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {statusCounts.map((status) => (
                          <Badge
                            key={`${session.id}-${status.status}`}
                            variant="secondary"
                            data-testid={`attendance-status-${status.status.toLowerCase()}`}
                          >
                            {status.status.toLowerCase()} · {status.count}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        No attendance records yet. Encourage staff to complete check-in.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get a head start on the most common workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                className="flex items-center justify-center rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
