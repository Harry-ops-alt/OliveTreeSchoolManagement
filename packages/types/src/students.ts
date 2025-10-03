import type { ID, OrgRef, Timestamped } from "./base";

export type Gender = "MALE" | "FEMALE" | "NON_BINARY" | "UNSPECIFIED";

export type StudentStatus =
  | "PROSPECT"
  | "APPLIED"
  | "ENROLLED"
  | "INACTIVE"
  | "GRADUATED"
  | "WITHDRAWN"
  | "ARCHIVED";

export interface Guardian extends Timestamped, OrgRef {
  id: ID;
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
}

export interface StudentGuardianLink extends Timestamped {
  id: ID;
  studentId: ID;
  guardianId: ID;
  relationship?: string | null;
  isPrimary: boolean;
  contactOrder?: number | null;
}

export interface StudentProfile extends Timestamped, OrgRef {
  id: ID;
  userId: ID;
  studentNumber: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  enrollmentDate: string;
  status: StudentStatus;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  gradeLevel?: string | null;
  homeroom?: string | null;
  primaryLanguage?: string | null;
  additionalSupportNotes?: string | null;
  medicalNotes?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  isArchived: boolean;
  archivedAt?: string | null;
}

export interface CreateGuardianInput {
  orgId: ID;
  branchId?: ID | null;
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
}

export interface UpdateGuardianInput extends Partial<CreateGuardianInput> {
  id: ID;
}

export interface CreateStudentInput {
  orgId: ID;
  branchId: ID;
  userId: ID;
  studentNumber: string;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  enrollmentDate?: string | null;
  status?: StudentStatus;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  gradeLevel?: string | null;
  homeroom?: string | null;
  primaryLanguage?: string | null;
  additionalSupportNotes?: string | null;
  medicalNotes?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  guardians?: Array<{
    guardianId: ID;
    relationship?: string | null;
    isPrimary?: boolean;
    contactOrder?: number | null;
  }>;
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  id: ID;
}
