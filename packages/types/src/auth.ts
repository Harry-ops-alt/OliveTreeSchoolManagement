import type { ID, Role } from "./base";

export interface SessionUser {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  orgId?: ID | null;
  branchId?: ID | null;
}

export interface AuthTokenPayload {
  sub: ID;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  orgId?: ID | null;
  branchId?: ID | null;
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 6,
  BRANCH_ADMIN: 5,
  ADMISSIONS: 4,
  TEACHER: 3,
  FINANCE: 2,
  PARENT: 1,
  STUDENT: 1,
};

export const DEFAULT_ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/app/admin",
  BRANCH_ADMIN: "/app/branches",
  ADMISSIONS: "/app/admissions",
  TEACHER: "/app/teaching",
  FINANCE: "/app/finance",
  PARENT: "/app/guardian",
  STUDENT: "/app/student",
};

export const canAccessRole = (
  userRole: Role,
  requiredRole: Role,
): boolean => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
