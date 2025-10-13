"use client";

export function StaffClient({ orgId, defaultBranchId }: { orgId: string; defaultBranchId?: string }): JSX.Element {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">School Information</p>
        <h1 className="text-3xl font-semibold text-white">Teachers & Staff</h1>
        <p className="max-w-2xl text-sm text-emerald-100/70">
          Teacher management UI will be implemented in the next iteration. API endpoints are ready.
        </p>
      </header>
    </div>
  );
}
