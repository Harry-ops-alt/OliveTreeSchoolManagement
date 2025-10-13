'use server';

import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/session';
import { BranchesSettingsClient } from '../settings/branches/branches-client';

const ALLOWED_ROLES = new Set([
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'OPERATIONS_MANAGER',
  'BRANCH_MANAGER',
]);

export default async function BranchesPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!ALLOWED_ROLES.has(session.role)) {
    redirect('/app');
  }

  if (!session.orgId) {
    redirect('/app');
  }

  return (
    <BranchesSettingsClient
      defaultBranchId={session.branchId ?? undefined}
      showSettingsTag={false}
    />
  );
}
