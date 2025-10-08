'use server';

import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/session';
import { CreateStudentClient } from './create-student-client';
import { getStudentFormBranches } from '../form-data';

export default async function CreateStudentPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.orgId) {
    redirect('/app/students');
  }

  const branchOptions = await getStudentFormBranches();

  return (
    <CreateStudentClient
      orgId={session.orgId}
      defaultBranchId={session.branchId}
      branches={branchOptions}
    />
  );
}
