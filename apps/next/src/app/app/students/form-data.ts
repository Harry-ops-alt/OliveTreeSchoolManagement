import { apiFetch } from '../../../lib/api-client';

export type StudentFormClassroomOption = {
  id: string;
  name: string;
};

export type StudentFormClassScheduleOption = {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type StudentFormBranchOption = {
  id: string;
  name: string;
  classrooms: StudentFormClassroomOption[];
  classSchedules: StudentFormClassScheduleOption[];
};

async function fetchBranches() {
  const response = await apiFetch('/branches');

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Branch request failed (${response.status}): ${text || 'Unknown error'}`);
  }

  return (await response.json()) as Array<{ id: string; name: string }>;
}

async function fetchClassrooms(branchId: string): Promise<StudentFormClassroomOption[]> {
  const response = await apiFetch(`/branches/${branchId}/rooms`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Classroom request failed (${response.status}): ${text || 'Unknown error'}`);
  }

  const data = (await response.json()) as Array<{ id: string; name: string }>;

  return data.map((room) => ({
    id: room.id,
    name: room.name,
  }));
}

async function fetchClassSchedules(branchId: string): Promise<StudentFormClassScheduleOption[]> {
  const response = await apiFetch(`/branches/${branchId}/schedules`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Class schedule request failed (${response.status}): ${text || 'Unknown error'}`);
  }

  const data = (await response.json()) as Array<{
    id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;

  return data.map((schedule) => ({
    id: schedule.id,
    title: schedule.title,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  }));
}

export async function getStudentFormBranches(): Promise<StudentFormBranchOption[]> {
  const branches = await fetchBranches();

  const results = await Promise.all(
    branches.map(async (branch) => {
      const [classrooms, classSchedules] = await Promise.all([
        fetchClassrooms(branch.id),
        fetchClassSchedules(branch.id),
      ]);

      return {
        id: branch.id,
        name: branch.name,
        classrooms,
        classSchedules,
      } satisfies StudentFormBranchOption;
    }),
  );

  return results;
}
