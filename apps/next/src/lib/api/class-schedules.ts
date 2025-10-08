import { ApiError, fetchJson, isApiError } from './fetch-json';
import type {
  ClassSchedule,
  ClassScheduleClashDetails,
  ClassScheduleConflictResponse,
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
} from '../types/class-schedules';

const SCHEDULES_BASE_PATH = '/branches';

export async function listClassSchedules(branchId: string): Promise<ClassSchedule[]> {
  return fetchJson<ClassSchedule[]>(`${SCHEDULES_BASE_PATH}/${branchId}/schedules`);
}

export class ClassScheduleConflictError extends ApiError<ClassScheduleConflictResponse> {
  readonly clashes: ClassScheduleClashDetails;

  constructor(error: ApiError<ClassScheduleConflictResponse>) {
    super(error.status, error.message, error.data);
    this.clashes = error.data?.clashes ?? { classroom: [], teacherProfiles: [], staffAssignments: [] };
    this.name = 'ClassScheduleConflictError';
  }
}

function throwIfScheduleConflict(error: unknown): never {
  if (isApiError<ClassScheduleConflictResponse>(error) && error.status === 409) {
    throw new ClassScheduleConflictError(error as ApiError<ClassScheduleConflictResponse>);
  }

  throw error;
}

export async function getClassSchedule(branchId: string, scheduleId: string): Promise<ClassSchedule> {
  return fetchJson<ClassSchedule>(`${SCHEDULES_BASE_PATH}/${branchId}/schedules/${scheduleId}`);
}

export async function createClassSchedule(
  branchId: string,
  data: CreateClassScheduleInput,
): Promise<ClassSchedule> {
  try {
    return await fetchJson<ClassSchedule, CreateClassScheduleInput>(`${SCHEDULES_BASE_PATH}/${branchId}/schedules`, {
      method: 'POST',
      body: data,
    });
  } catch (error) {
    throwIfScheduleConflict(error);
  }
}

export async function updateClassSchedule(
  branchId: string,
  scheduleId: string,
  data: UpdateClassScheduleInput,
): Promise<ClassSchedule> {
  try {
    return await fetchJson<ClassSchedule, UpdateClassScheduleInput>(
      `${SCHEDULES_BASE_PATH}/${branchId}/schedules/${scheduleId}`,
      {
        method: 'PATCH',
        body: data,
      },
    );
  } catch (error) {
    throwIfScheduleConflict(error);
  }
}

export async function deleteClassSchedule(branchId: string, scheduleId: string): Promise<void> {
  await fetchJson<void>(`${SCHEDULES_BASE_PATH}/${branchId}/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
}
