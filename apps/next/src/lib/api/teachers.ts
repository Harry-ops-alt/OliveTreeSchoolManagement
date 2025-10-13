import { fetchJson } from './fetch-json';
import type {
  Teacher,
  CreateTeacherInput,
  UpdateTeacherInput,
  ListTeachersParams,
  ListTeachersResponse,
} from '../types/teachers';

const TEACHERS_BASE_PATH = '/teachers';

export async function listTeachers(params?: ListTeachersParams): Promise<ListTeachersResponse> {
  const searchParams = new URLSearchParams();

  if (params?.q) searchParams.set('q', params.q);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.subject) searchParams.set('subject', params.subject);
  if (params?.order) searchParams.set('order', params.order);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  const url = query ? `${TEACHERS_BASE_PATH}?${query}` : TEACHERS_BASE_PATH;

  return fetchJson<ListTeachersResponse>(url);
}

export async function getTeacher(id: string): Promise<Teacher> {
  return fetchJson<Teacher>(`${TEACHERS_BASE_PATH}/${id}`);
}

export async function createTeacher(data: CreateTeacherInput): Promise<Teacher> {
  return fetchJson<Teacher>(TEACHERS_BASE_PATH, {
    method: 'POST',
    body: data,
  });
}

export async function updateTeacher(id: string, data: UpdateTeacherInput): Promise<Teacher> {
  return fetchJson<Teacher>(`${TEACHERS_BASE_PATH}/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteTeacher(id: string): Promise<Teacher> {
  return fetchJson<Teacher>(`${TEACHERS_BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}
