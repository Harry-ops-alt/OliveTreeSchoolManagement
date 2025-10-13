import { fetchJson } from './fetch-json';
import type { Class, CreateClassInput, UpdateClassInput, ListClassesParams, ListClassesResponse } from '../types/classes';

const CLASSES_BASE_PATH = '/classes';

export async function listClasses(params?: ListClassesParams): Promise<ListClassesResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.q) searchParams.set('q', params.q);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.classroomId) searchParams.set('classroomId', params.classroomId);
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
  if (params?.order) searchParams.set('order', params.order);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  const url = query ? `${CLASSES_BASE_PATH}?${query}` : CLASSES_BASE_PATH;

  return fetchJson<ListClassesResponse>(url);
}

export async function getClass(id: string): Promise<Class> {
  return fetchJson<Class>(`${CLASSES_BASE_PATH}/${id}`);
}

export async function createClass(data: CreateClassInput): Promise<Class> {
  return fetchJson<Class>(CLASSES_BASE_PATH, {
    method: 'POST',
    body: data,
  });
}

export async function updateClass(id: string, data: UpdateClassInput): Promise<Class> {
  return fetchJson<Class>(`${CLASSES_BASE_PATH}/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteClass(id: string): Promise<Class> {
  return fetchJson<Class>(`${CLASSES_BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}
