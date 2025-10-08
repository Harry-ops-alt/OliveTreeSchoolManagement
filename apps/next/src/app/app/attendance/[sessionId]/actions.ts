'use server';

import { revalidatePath } from 'next/cache';
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../types';
import { apiFetch } from '../../../../lib/api-client';

export type UpdateAttendanceFormState = {
  success: boolean;
  error?: string;
};

export async function updateAttendanceSessionAction(
  _prevState: UpdateAttendanceFormState,
  formData: FormData,
): Promise<UpdateAttendanceFormState> {
  const sessionId = formData.get('sessionId');

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { success: false, error: 'Missing session identifier.' };
  }

  const finalizeRaw = formData.get('finalize');
  const finalize = finalizeRaw === 'on' || finalizeRaw === 'true';

  const records: { studentId: string; status: AttendanceStatus; notes?: string }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('status-')) {
      continue;
    }

    const studentId = key.slice('status-'.length);
    if (!studentId) {
      continue;
    }

    if (typeof value !== 'string') {
      return { success: false, error: `Invalid status for student ${studentId}.` };
    }

    const canonicalStatus = value.toUpperCase();
    if (!ATTENDANCE_STATUSES.includes(canonicalStatus as AttendanceStatus)) {
      return {
        success: false,
        error: `Unsupported status "${value}" for student ${studentId}.`,
      };
    }

    const notesValue = formData.get(`notes-${studentId}`);
    const trimmedNotes =
      typeof notesValue === 'string' && notesValue.trim().length > 0
        ? notesValue.trim()
        : undefined;

    records.push({
      studentId,
      status: canonicalStatus as AttendanceStatus,
      notes: trimmedNotes,
    });
  }

  if (records.length === 0) {
    return { success: false, error: 'No attendance records submitted.' };
  }

  try {
    const response = await apiFetch(`/attendance/sessions/${sessionId}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records, finalize }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Failed to update attendance (status ${response.status}): ${text || 'Unknown error'}.`,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Unable to update attendance: ${message}` };
  }

  revalidatePath(`/app/attendance/${sessionId}`);
  revalidatePath('/app');

  return { success: true };
}
