import { apiFetch } from '../../../../../lib/api-client';

export type StudentAttendanceItem = {
  sessionId: string;
  sessionDate: string;
  sessionStatus: string;
  sessionNotes: string | null;
  branch: {
    id: string;
    name: string;
  };
  classSchedule?: {
    id: string;
    title: string | null;
  } | null;
  recordStatus: string;
  recordNotes: string | null;
  recordedAt: string | null;
};

interface RawStudentAttendanceItem {
  session: {
    id: string;
    date: string;
    status: string;
    notes?: string | null;
    branch: {
      id: string;
      name: string;
    };
    classSchedule?: {
      id: string;
      title: string | null;
    } | null;
  };
  record: {
    status: string;
    notes?: string | null;
    recordedAt?: string | null;
  };
}

export async function getStudentAttendanceHistory(studentId: string): Promise<StudentAttendanceItem[]> {
  const response = await apiFetch(`/attendance/students/${studentId}`);

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Student attendance request failed (${response.status}): ${text || 'Unknown error'}`);
  }

  const data = (await response.json()) as RawStudentAttendanceItem[];

  return data.map((item) => ({
    sessionId: item.session.id,
    sessionDate: item.session.date,
    sessionStatus: item.session.status,
    sessionNotes: item.session.notes ?? null,
    branch: item.session.branch,
    classSchedule: item.session.classSchedule ?? null,
    recordStatus: item.record.status,
    recordNotes: item.record.notes ?? null,
    recordedAt: item.record.recordedAt ?? null,
  }));
}
