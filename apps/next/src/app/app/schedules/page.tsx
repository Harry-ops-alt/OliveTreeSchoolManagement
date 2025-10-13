import { getSession } from '../../../lib/session';
import { redirect } from 'next/navigation';
import { SchedulesClient } from './schedules-client';

export default async function SchedulesPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.orgId) {
    redirect('/app');
  }

  return <SchedulesClient orgId={session.orgId} defaultBranchId={session.branchId ?? undefined} />;
}
