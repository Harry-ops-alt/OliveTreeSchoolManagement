export type ID = string;

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export type Role =
  | "SUPER_ADMIN"
  | "BRANCH_ADMIN"
  | "ADMISSIONS"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "FINANCE";

export interface OrgRef {
  orgId: ID;
  branchId?: ID | null;
}
