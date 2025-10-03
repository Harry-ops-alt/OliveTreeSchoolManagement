import { apiFetch } from '../../../lib/api-client';

type AdmissionItem = {
  id: string;
  studentName: string;
  status: string;
  branchName: string;
  appliedAt: string;
};

async function getAdmissions(): Promise<AdmissionItem[]> {
  const response = await apiFetch('/dashboard/admissions/recent');

  if (!response.ok) {
    throw new Error(`Admissions request failed (${response.status})`);
  }

  return (await response.json()) as AdmissionItem[];
}

function toTitle(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
});

export default async function AdmissionsPage() {
  let admissions: AdmissionItem[] = [];
  let loadFailed = false;

  try {
    admissions = await getAdmissions();
  } catch (error) {
    console.error('Failed to load admissions', error);
    loadFailed = true;
  }

  const hasAdmissions = admissions.length > 0;

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">Admissions</p>
          <h1 className="text-3xl font-semibold text-white">Recent applications</h1>
          <p className="text-sm text-emerald-100/70">
            Review the latest admissions activity across branches. Updated automatically from the Nest
            API seed data.
          </p>
        </header>

        {loadFailed ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 text-sm text-emerald-100/70">
            Unable to load admissions right now. Please try again shortly.
          </div>
        ) : null}

        {hasAdmissions ? (
          <ul className="space-y-4" data-testid="admissions-detail-list">
            {admissions.map((admission) => {
              const appliedDisplay = dateFormatter.format(new Date(admission.appliedAt));
              return (
                <li
                  key={admission.id}
                  className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6"
                  data-testid="admissions-detail-item"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{admission.studentName}</p>
                      <p className="text-sm text-emerald-200/80">{admission.branchName}</p>
                    </div>
                    <span className="self-start rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
                      {toTitle(admission.status)}
                    </span>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-wide text-emerald-100/60">
                    Applied {appliedDisplay}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : !loadFailed ? (
          <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/50 p-10 text-center text-sm text-emerald-100/70">
            No admissions have been recorded yet. Seed the database to populate this view.
          </div>
        ) : null}
      </div>
    </div>
  );
}
