'use server';

import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/session';
import { CreateStudentClient } from './create-student-client';

export default async function CreateStudentPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.orgId) {
    redirect('/app/students');
  }

  return (
    <CreateStudentClient orgId={session.orgId} defaultBranchId={session.branchId} />
  );
}
