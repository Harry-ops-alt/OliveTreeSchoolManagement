import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/session';
import { BranchesSettingsClient } from './branches-client';

export default async function BranchesSettingsPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.orgId) {
    redirect('/app/settings');
  }

  return <BranchesSettingsClient defaultBranchId={session.branchId ?? undefined} />;
}
