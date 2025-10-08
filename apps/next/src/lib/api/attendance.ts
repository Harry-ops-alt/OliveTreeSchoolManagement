import { fetchJson } from '../api/fetch-json';

const ATTENDANCE_BASE_PATH = '/attendance';

export interface CreateAttendanceSessionPayload {
  branchId: string;
  date: string;
  classScheduleId?: string;
  notes?: string;
}

export async function createAttendanceSession(payload: CreateAttendanceSessionPayload): Promise<void> {
  await fetchJson<void>(`${ATTENDANCE_BASE_PATH}/sessions`, {
    method: 'POST',
    body: payload,
  });
}
