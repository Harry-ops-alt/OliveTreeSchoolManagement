import type { Role } from '@prisma/client';

export type Capability =
  | 'platform:tenancy'
  | 'platform:settings'
  | 'admissions:manage'
  | 'operations:branches'
  | 'operations:rostering'
  | 'operations:attendance'
  | 'lms:teaching'
  | 'lms:training'
  | 'finance:manage'
  | 'finance:view'
  | 'payments:process'
  | 'communications:send'
  | 'analytics:view'
  | 'tasks:manage'
  | 'tasks:view';

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  SUPER_ADMIN: [
    'platform:tenancy',
    'platform:settings',
    'admissions:manage',
    'operations:branches',
    'operations:rostering',
    'operations:attendance',
    'lms:teaching',
    'lms:training',
    'finance:manage',
    'payments:process',
    'finance:view',
    'communications:send',
    'analytics:view',
    'tasks:manage',
    'tasks:view',
  ],
  SCHOOL_ADMIN: [
    'platform:settings',
    'admissions:manage',
    'operations:branches',
    'operations:rostering',
    'operations:attendance',
    'finance:view',
    'communications:send',
    'analytics:view',
    'tasks:manage',
    'tasks:view',
  ],
  OPERATIONS_MANAGER: [
    'operations:branches',
    'operations:rostering',
    'operations:attendance',
    'analytics:view',
    'tasks:manage',
    'tasks:view',
  ],
  BRANCH_MANAGER: [
    'operations:rostering',
    'operations:attendance',
    'communications:send',
    'tasks:manage',
    'tasks:view',
  ],
  ADMISSIONS_OFFICER: [
    'admissions:manage',
    'communications:send',
    'analytics:view',
    'tasks:view',
  ],
  FINANCE_MANAGER: [
    'finance:manage',
    'payments:process',
    'finance:view',
    'analytics:view',
    'tasks:view',
  ],
  FINANCE_OFFICER: [
    'payments:process',
    'finance:view',
    'tasks:view',
  ],
  TEACHER: [
    'operations:attendance',
    'lms:teaching',
    'communications:send',
    'tasks:view',
  ],
  TEACHING_ASSISTANT: [
    'operations:attendance',
    'lms:teaching',
    'tasks:view',
  ],
  TRAINER: [
    'lms:training',
    'communications:send',
    'tasks:manage',
  ],
  TRAINEE: ['lms:training', 'tasks:view'],
  SUPPORT_STAFF: ['operations:attendance', 'tasks:view'],
  PARENT_GUARDIAN: ['payments:process', 'tasks:view'],
  STUDENT: ['lms:teaching', 'tasks:view'],
};

export const hasCapability = (role: Role, capability: Capability): boolean =>
  ROLE_CAPABILITIES[role]?.includes(capability) ?? false;

export const hasAnyCapability = (role: Role, capabilities: Capability[]): boolean =>
  capabilities.some((capability) => hasCapability(role, capability));
