import { getSession } from '../../../lib/session';
import { redirect } from 'next/navigation';
import { ClassesClient } from './classes-client';

export default async function ClassesPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.orgId) {
    redirect('/app');
  }

  return <ClassesClient orgId={session.orgId} defaultBranchId={session.branchId ?? undefined} />;
}
