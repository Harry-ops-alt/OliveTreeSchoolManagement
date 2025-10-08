'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '../../../../../lib/api/fetch-json';
import { updateStudent, type UpdateStudentPayload } from '../../../../../lib/api/students';
import { StudentForm, type StudentFormValues } from '../../../../../components/students/student-form';
import { useToastHelpers } from '../../../../../components/toast/toast-provider';
import type { StudentFormBranchOption } from '../../../../../lib/types/student-form';

interface EditStudentClientProps {
  studentId: string;
  orgId: string;
  initialValues: StudentFormValues;
  branches: StudentFormBranchOption[];
}

export function EditStudentClient({ studentId, orgId, initialValues, branches }: EditStudentClientProps): JSX.Element {
  const router = useRouter();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();

  const handleUpdate = useCallback(
    async (payload: UpdateStudentPayload) => {
      try {
        await updateStudent(studentId, payload);
        showSuccessToast('Student profile updated successfully.', 'Student updated');
        router.push(`/app/students/${studentId}`);
      } catch (error) {
        console.error('Failed to update student', error);

        if (error instanceof ApiError) {
          showErrorToast(error.message || 'Unable to update student.');
          return;
        }

        showErrorToast('Unable to update student. Please try again.');
      }
    },
    [router, showErrorToast, showSuccessToast, studentId],
  );

  const handleCreate = useCallback(async () => {
    throw new Error('Create operation is not supported when editing a student.');
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">Students</p>
        <h1 className="text-3xl font-semibold text-white">Edit student</h1>
        <p className="text-sm text-emerald-100/70">
          Update student information, adjust guardian relationships, and keep records current.
        </p>
      </header>

      <StudentForm
        mode="update"
        orgId={orgId}
        branchOptions={branches}
        initialValues={initialValues}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </div>
  );
}
