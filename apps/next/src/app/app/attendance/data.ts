import { apiFetch } from '../../../lib/api-client';
import { ATTENDANCE_STATUSES, AttendanceSessionDetail, AttendanceSessionSummary } from './types';

interface RawAttendanceSession {
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
    title: string;
  } | null;
  statusCounts: Record<string, number>;
}

interface RawAttendanceRecord {
  id: string;
  status: string;
  notes?: string | null;
  recordedAt?: string | null;
  student: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface RawAttendanceSessionDetail extends RawAttendanceSession {
  submittedAt?: string | null;
  finalizedAt?: string | null;
  records: RawAttendanceRecord[];
}

async function fetchWithAuth(path: string): Promise<Response> {
  return apiFetch(path);
}

function mapStatusCounts(raw: Record<string, number>): Partial<Record<typeof ATTENDANCE_STATUSES[number], number>> {
  const counts: Partial<Record<typeof ATTENDANCE_STATUSES[number], number>> = {};

  for (const status of ATTENDANCE_STATUSES) {
    if (typeof raw[status] === 'number') {
      counts[status] = raw[status];
    }
  }

  return counts;
}

export async function getAttendanceSessions(): Promise<AttendanceSessionSummary[]> {
  const response = await fetchWithAuth('/attendance/sessions');

  if (!response.ok) {
    throw new Error(`Attendance sessions request failed (${response.status})`);
  }

  const data = (await response.json()) as RawAttendanceSession[];

  return data.map((session) => ({
    id: session.id,
    date: session.date,
    status: session.status,
    notes: session.notes ?? null,
    branch: session.branch,
    classSchedule: session.classSchedule ?? null,
    statusCounts: mapStatusCounts(session.statusCounts ?? {}),
  }));
}

export async function getAttendanceSession(sessionId: string): Promise<AttendanceSessionDetail | null> {
  const response = await fetchWithAuth(`/attendance/sessions/${sessionId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Attendance session request failed (${response.status})`);
  }

  const data = (await response.json()) as RawAttendanceSessionDetail;

  return {
    id: data.id,
    date: data.date,
    status: data.status,
    branchName: data.branch.name,
    classScheduleTitle: data.classSchedule?.title ?? null,
    notes: data.notes ?? null,
    submittedAt: data.submittedAt ?? null,
    finalizedAt: data.finalizedAt ?? null,
    records: data.records.map((record) => ({
      studentId: record.student.id,
      studentName: `${record.student.user.firstName} ${record.student.user.lastName}`.trim(),
      studentEmail: record.student.user.email,
      status: (record.status as typeof ATTENDANCE_STATUSES[number]) ?? 'PRESENT',
      notes: record.notes ?? null,
      recordedAt: record.recordedAt ?? null,
    })),
  };
}
