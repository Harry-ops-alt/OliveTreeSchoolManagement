'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '../../../../lib/api/fetch-json';
import {
  createStudent,
  type CreateStudentPayload,
  type UpdateStudentPayload,
} from '../../../../lib/api/students';
import { StudentForm, type StudentFormValues } from '../../../../components/students/student-form';
import { useToastHelpers } from '../../../../components/toast/toast-provider';
import type { StudentFormBranchOption } from '../../../../lib/types/student-form';

interface CreateStudentClientProps {
  orgId: string;
  defaultBranchId?: string | null;
  branches: StudentFormBranchOption[];
}

export function CreateStudentClient({ orgId, defaultBranchId, branches }: CreateStudentClientProps): JSX.Element {
  const router = useRouter();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();

  const handleCreate = useCallback(
    async (payload: CreateStudentPayload) => {
      try {
        const student = await createStudent(payload);
        showSuccessToast('Student profile created successfully.', 'Student created');
        router.push(`/app/students/${student.id}`);
      } catch (error) {
        console.error('Failed to create student', error);

        if (error instanceof ApiError) {
          const message =
            typeof error.data === 'object' && error.data && 'message' in error.data
              ? String((error.data as Record<string, unknown>).message)
              : error.message;
          showErrorToast(message);
          return;
        }

        showErrorToast('Unable to create student. Please try again.');
      }
    },
    [router, showErrorToast, showSuccessToast],
  );

  const handleUpdate = useCallback(async (_payload: UpdateStudentPayload) => {
    throw new Error('Update operation is not supported in create mode.');
  }, []);

  const initialValues: Partial<StudentFormValues> = {
    branchId: defaultBranchId ?? '',
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">Students</p>
        <h1 className="text-3xl font-semibold text-white">Create student</h1>
        <p className="text-sm text-emerald-100/70">
          Register a new student profile, capture guardian relationships, and track their contact details.
        </p>
      </header>

      <StudentForm
        mode="create"
        orgId={orgId}
        branchOptions={branches}
        initialValues={initialValues}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </div>
  );
}
