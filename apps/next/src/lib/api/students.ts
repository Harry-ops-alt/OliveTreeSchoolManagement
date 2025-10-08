import { fetchJson, ApiError } from './fetch-json';

export type StudentListParams = {
  search?: string;
  branchId?: string;
  gradeLevel?: string;
  page?: number;
  pageSize?: number;
  includeArchived?: boolean;
};

export type StudentListMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type StudentGuardian = {
  id: string;
  guardianId: string;
  relationship?: string | null;
  isPrimary: boolean;
  contactOrder?: number | null;
  guardian?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

export type StudentAdmission = {
  id: string;
  status: string;
  appliedAt: string;
  branchId?: string | null;
};

export type StudentUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type StudentBranch = {
  id: string;
  name: string;
};

export type StudentClassroom = {
  id: string;
  name: string;
};

export type StudentClassEnrollment = {
  id: string;
  classSchedule: {
    id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    classroomId?: string | null;
    branchId: string;
  };
};

export type StudentWithRelations = {
  id: string;
  studentNumber?: string | null;
  orgId?: string | null;
  status?: string | null;
  gradeLevel?: string | null;
  homeroom?: string | null;
  primaryLanguage?: string | null;
  additionalSupportNotes?: string | null;
  medicalNotes?: string | null;
  branchId?: string | null;
  dateJoined?: string | null;
  enrollmentDate?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  isArchived?: boolean | null;
  archivedAt?: string | null;
  userId?: string | null;
  user?: StudentUser | null;
  branch?: StudentBranch | null;
  classroom?: StudentClassroom | null;
  guardians?: StudentGuardian[];
  admissions?: StudentAdmission[];
  classEnrollments?: StudentClassEnrollment[];
};

export type ListStudentsResponse = {
  data: StudentWithRelations[];
  meta: StudentListMeta;
};

function buildQuery(params: StudentListParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.branchId) {
    searchParams.set('branchId', params.branchId);
  }
  if (params.gradeLevel) {
    searchParams.set('gradeLevel', params.gradeLevel);
  }
  if (params.page) {
    searchParams.set('page', params.page.toString());
  }
  if (params.pageSize) {
    searchParams.set('pageSize', params.pageSize.toString());
  }
  if (typeof params.includeArchived === 'boolean') {
    searchParams.set('includeArchived', params.includeArchived ? 'true' : 'false');
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listStudents(params: StudentListParams = {}): Promise<ListStudentsResponse> {
  return await fetchJson<ListStudentsResponse>(`/students${buildQuery(params)}`);
}

export async function deleteStudent(id: string): Promise<void> {
  await fetchJson(`/students/${id}`, {
    method: 'DELETE',
  });
}

export { ApiError };

export type GuardianLinkInput = {
  guardianId: string;
  relationship?: string | null;
  isPrimary?: boolean;
  order?: number | null;
};

export type InlineGuardianInput = {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  relationship?: string | null;
  isPrimary?: boolean;
  order?: number | null;
};

export type UpdateGuardianLinkInput = {
  linkId?: string;
  guardianId?: string;
  relationship?: string | null;
  isPrimary?: boolean;
  order?: number | null;
};

export type UpdateInlineGuardianInput = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  relationship?: string | null;
  isPrimary?: boolean;
  order?: number | null;
};

export type CreateStudentPayload = {
  orgId: string;
  branchId: string;
  classroomId?: string;
  classScheduleIds?: string[];
  firstName: string;
  lastName: string;
  studentNumber: string;
  userId?: string;
  dateJoined?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  enrollmentDate?: string;
  status?: string;
  dateOfBirth?: string;
  gender?: string;
  gradeLevel?: string;
  homeroom?: string;
  primaryLanguage?: string;
  additionalSupportNotes?: string;
  medicalNotes?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  guardians?: GuardianLinkInput[];
  inlineGuardians?: InlineGuardianInput[];
};

export type UpdateStudentPayload = {
  branchId?: string;
  classroomId?: string | null;
  classScheduleIds?: string[];
  firstName?: string;
  lastName?: string;
  studentNumber?: string;
  dateJoined?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  enrollmentDate?: string;
  status?: string;
  dateOfBirth?: string;
  gender?: string;
  gradeLevel?: string;
  homeroom?: string;
  primaryLanguage?: string;
  additionalSupportNotes?: string;
  medicalNotes?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  guardians?: UpdateGuardianLinkInput[];
  inlineGuardians?: UpdateInlineGuardianInput[];
  archive?: boolean;
  archivedAt?: string;
};

export async function getStudent(id: string): Promise<StudentWithRelations> {
  return await fetchJson<StudentWithRelations>(`/students/${id}`);
}

export async function createStudent(payload: CreateStudentPayload): Promise<StudentWithRelations> {
  return await fetchJson<StudentWithRelations>('/students', {
    method: 'POST',
    body: payload,
  });
}

export async function updateStudent(
  id: string,
  payload: UpdateStudentPayload,
): Promise<StudentWithRelations> {
  return await fetchJson<StudentWithRelations>(`/students/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}
