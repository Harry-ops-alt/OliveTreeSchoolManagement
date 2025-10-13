import { getSession } from '../../../lib/session';
import { redirect } from 'next/navigation';
import { StaffClient } from './staff-client';

export default async function StaffPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.orgId) {
    redirect('/app');
  }

  return <StaffClient orgId={session.orgId} defaultBranchId={session.branchId ?? undefined} />;
}
