import { apiFetch } from '../../../../lib/api-client';

export type StudentGuardianDetail = {
  id: string;
  guardianId: string;
  relationship: string | null;
  isPrimary: boolean;
  contactOrder: number | null;
  guardian: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export type StudentAdmissionDetail = {
  id: string;
  status: string;
  appliedAt: string;
  branchId: string | null;
};

export type StudentClassroomDetail = {
  id: string;
  name: string;
  branchId: string;
};

export type StudentClassEnrollmentDetail = {
  id: string;
  classSchedule: {
    id: string;
    title: string | null;
    dayOfWeek: string | null;
    startTime: string | null;
    endTime: string | null;
    branchId: string | null;
    classroomId: string | null;
  } | null;
};

export type StudentDetail = {
  id: string;
  orgId: string | null;
  branchId: string | null;
  firstName: string | null;
  lastName: string | null;
  studentNumber: string | null;
  status: string | null;
  gradeLevel: string | null;
  homeroom: string | null;
  primaryLanguage: string | null;
  additionalSupportNotes: string | null;
  medicalNotes: string | null;
  dateJoined: string | null;
  enrollmentDate: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  user?: {
    id: string;
    email: string | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    organizationId: string | null;
  } | null;
  classroom?: StudentClassroomDetail | null;
  guardians: StudentGuardianDetail[];
  admissions: StudentAdmissionDetail[];
  classEnrollments?: StudentClassEnrollmentDetail[];
};

export async function getStudentDetail(studentId: string): Promise<StudentDetail | null> {
  const response = await apiFetch(`/students/${studentId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Student detail request failed (${response.status}): ${text || 'Unknown error'}`);
  }

  const data = (await response.json()) as any;

  return {
    id: data.id,
    orgId: data.orgId ?? data.branch?.organizationId ?? null,
    branchId: data.branchId ?? null,
    firstName: data.user?.firstName ?? null,
    lastName: data.user?.lastName ?? null,
    studentNumber: data.studentNumber ?? null,
    status: data.status ?? null,
    gradeLevel: data.gradeLevel ?? null,
    homeroom: data.homeroom ?? null,
    primaryLanguage: data.primaryLanguage ?? null,
    additionalSupportNotes: data.additionalSupportNotes ?? null,
    medicalNotes: data.medicalNotes ?? null,
    dateJoined: data.dateJoined ?? null,
    enrollmentDate: data.enrollmentDate ?? null,
    dateOfBirth: data.dateOfBirth ?? null,
    gender: data.gender ?? null,
    email: data.email ?? data.user?.email ?? null,
    phone: data.phone ?? null,
    alternatePhone: data.alternatePhone ?? null,
    addressLine1: data.addressLine1 ?? null,
    addressLine2: data.addressLine2 ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    postalCode: data.postalCode ?? null,
    country: data.country ?? null,
    notes: data.notes ?? null,
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email ?? null,
        }
      : null,
    branch: data.branch
      ? {
          id: data.branch.id,
          name: data.branch.name,
          organizationId: data.branch.organizationId ?? null,
        }
      : null,
    classroom: data.classroom
      ? {
          id: data.classroom.id,
          name: data.classroom.name ?? 'Unnamed classroom',
          branchId: data.classroom.branchId ?? data.branchId ?? '',
        }
      : null,
    guardians:
      Array.isArray(data.guardians)
        ? data.guardians.map((link: any) => ({
            id: link.id ?? `${link.guardianId}-${link.relationship ?? ''}`,
            guardianId: link.guardianId,
            relationship: link.relationship ?? null,
            isPrimary: Boolean(link.isPrimary),
            contactOrder: link.contactOrder ?? null,
            guardian: link.guardian
              ? {
                  id: link.guardian.id,
                  firstName: link.guardian.firstName ?? null,
                  lastName: link.guardian.lastName ?? null,
                  email: link.guardian.email ?? null,
                  phone: link.guardian.phone ?? null,
                }
              : null,
          }))
        : [],
    admissions:
      Array.isArray(data.admissions)
        ? data.admissions.map((admission: any) => ({
            id: admission.id,
            status: admission.status ?? 'UNKNOWN',
            appliedAt: admission.appliedAt ?? null,
            branchId: admission.branchId ?? null,
          }))
        : [],
    classEnrollments: Array.isArray(data.classEnrollments)
      ? data.classEnrollments.map((enrollment: any) => ({
          id: enrollment.id ?? `${enrollment.studentId ?? 'student'}-${enrollment.classScheduleId ?? 'schedule'}`,
          classSchedule: enrollment.classSchedule
            ? {
                id: enrollment.classSchedule.id,
                title: enrollment.classSchedule.title ?? null,
                dayOfWeek: enrollment.classSchedule.dayOfWeek ?? null,
                startTime: enrollment.classSchedule.startTime ?? null,
                endTime: enrollment.classSchedule.endTime ?? null,
                branchId: enrollment.classSchedule.branchId ?? null,
                classroomId: enrollment.classSchedule.classroomId ?? null,
              }
            : null,
        }))
      : [],
  };
}
