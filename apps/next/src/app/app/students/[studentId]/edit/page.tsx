import { notFound } from 'next/navigation';
import { getStudentDetail } from '../data';
import type { StudentFormValues } from '../../../../../components/students/student-form';
import { EditStudentClient } from './EditStudentClient';
import { getStudentFormBranches } from '../../form-data';

function mapStudentToFormValues(
  student: NonNullable<Awaited<ReturnType<typeof getStudentDetail>>>,
  orgId: string,
  branchId: string,
): StudentFormValues {
  return {
    orgId,
    branchId,
    classroomId: student.classroom?.id ?? undefined,
    classScheduleIds:
      student.classEnrollments?.map((enrollment) => enrollment.classSchedule?.id).filter((id): id is string => Boolean(id)) ?? [],
    userId: student.user?.id ?? undefined,
    firstName: student.firstName ?? '',
    lastName: student.lastName ?? '',
    studentNumber: student.studentNumber ?? '',
    dateJoined: student.dateJoined ?? undefined,
    email: student.email ?? undefined,
    phone: student.phone ?? undefined,
    alternatePhone: student.alternatePhone ?? undefined,
    enrollmentDate: student.enrollmentDate ?? undefined,
    status: student.status ?? undefined,
    dateOfBirth: student.dateOfBirth ?? undefined,
    gender: student.gender ?? undefined,
    gradeLevel: student.gradeLevel ?? undefined,
    homeroom: student.homeroom ?? undefined,
    primaryLanguage: student.primaryLanguage ?? undefined,
    additionalSupportNotes: student.additionalSupportNotes ?? undefined,
    medicalNotes: student.medicalNotes ?? undefined,
    addressLine1: student.addressLine1 ?? undefined,
    addressLine2: student.addressLine2 ?? undefined,
    city: student.city ?? undefined,
    state: student.state ?? undefined,
    postalCode: student.postalCode ?? undefined,
    country: student.country ?? undefined,
    notes: student.notes ?? undefined,
    guardians: student.guardians.map((guardian) => ({
      linkId: guardian.id,
      guardianId: guardian.guardianId,
      relationship: guardian.relationship ?? undefined,
      isPrimary: guardian.isPrimary,
      order: guardian.contactOrder ?? undefined,
    })),
    inlineGuardians: [],
  };
}

export default async function EditStudentPage({ params }: { params: { studentId: string } }) {
  const student = await getStudentDetail(params.studentId);

  if (!student) {
    notFound();
  }

  const branchId = student.branchId ?? student.branch?.id ?? null;
  if (!branchId) {
    notFound();
  }

  const orgId = student.orgId ?? student.branch?.organizationId ?? null;
  if (!orgId) {
    notFound();
  }

  const initialValues = mapStudentToFormValues(student, orgId, branchId);
  const branches = await getStudentFormBranches();

  return (
    <EditStudentClient
      studentId={student.id}
      orgId={orgId}
      initialValues={initialValues}
      branches={branches}
    />
  );
}
