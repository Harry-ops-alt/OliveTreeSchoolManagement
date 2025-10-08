import { fetchJson } from './fetch-json';
import type { Branch, Classroom } from '../types/branches';
import type { TeacherProfileSummary } from '../types/class-schedules';

const BRANCHES_BASE_PATH = '/branches';

// ---------------- Branch Helpers ----------------

export async function listBranches(): Promise<Branch[]> {
  return fetchJson<Branch[]>(BRANCHES_BASE_PATH);
}

export async function createBranch(data: Partial<Branch>): Promise<Branch> {
  return fetchJson<Branch>(BRANCHES_BASE_PATH, {
    method: 'POST',
    body: data,
  });
}

export async function updateBranch(branchId: string, data: Partial<Branch>): Promise<Branch> {
  return fetchJson<Branch>(`${BRANCHES_BASE_PATH}/${branchId}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteBranch(branchId: string): Promise<void> {
  await fetchJson<void>(`${BRANCHES_BASE_PATH}/${branchId}`, {
    method: 'DELETE',
  });
}

// ---------------- Classroom Helpers ----------------
export async function listClassrooms(branchId: string): Promise<Classroom[]> {
  return fetchJson<Classroom[]>(`${BRANCHES_BASE_PATH}/${branchId}/rooms`);
}

export async function createClassroom(branchId: string, data: Partial<Classroom>): Promise<Classroom> {
  return fetchJson<Classroom>(`${BRANCHES_BASE_PATH}/${branchId}/rooms`, {
    method: 'POST',
    body: data,
  });
}

export async function updateClassroom(
  branchId: string,
  roomId: string,
  data: Partial<Classroom>,
): Promise<Classroom> {
  return fetchJson<Classroom>(`${BRANCHES_BASE_PATH}/${branchId}/rooms/${roomId}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteClassroom(branchId: string, roomId: string): Promise<void> {
  await fetchJson<void>(`${BRANCHES_BASE_PATH}/${branchId}/rooms/${roomId}`, {
    method: 'DELETE',
  });
}

type ApiTeacherProfile = {
  id: string;
  branchId: string;
  userId: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

export async function listTeacherProfiles(branchId: string): Promise<TeacherProfileSummary[]> {
  const profiles = await fetchJson<ApiTeacherProfile[]>(`${BRANCHES_BASE_PATH}/${branchId}/teacher-profiles`);

  return profiles.map((profile) => ({
    id: profile.id,
    branchId: profile.branchId,
    user: profile.user
      ? {
          id: profile.user.id,
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          email: profile.user.email,
        }
      : null,
  }));
}
