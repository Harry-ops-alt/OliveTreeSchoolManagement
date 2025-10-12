import type { Role } from '@prisma/client';

export enum AdmissionsCapability {
  ManageLeads = 'admissions.manage_leads',
  ViewLeads = 'admissions.view_leads',
  ManageTasters = 'admissions.manage_tasters',
  ManageApplications = 'admissions.manage_applications',
}

export enum SisCapability {
  ViewBranches = 'sis.view_branches',
  ManageBranches = 'sis.manage_branches',
  ViewClassSchedules = 'sis.view_class_schedules',
  ManageClassSchedules = 'sis.manage_class_schedules',
  ViewStudents = 'sis.view_students',
  ManageStudents = 'sis.manage_students',
}

export type Capability =
  | 'platform:tenancy'
  | 'platform:settings'
  | AdmissionsCapability.ManageLeads
  | AdmissionsCapability.ViewLeads
  | AdmissionsCapability.ManageTasters
  | AdmissionsCapability.ManageApplications
  | SisCapability.ViewBranches
  | SisCapability.ManageBranches
  | SisCapability.ViewClassSchedules
  | SisCapability.ManageClassSchedules
  | SisCapability.ViewStudents
  | SisCapability.ManageStudents
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
    AdmissionsCapability.ManageLeads,
    AdmissionsCapability.ViewLeads,
    AdmissionsCapability.ManageTasters,
    AdmissionsCapability.ManageApplications,
    SisCapability.ViewBranches,
    SisCapability.ManageBranches,
    SisCapability.ViewClassSchedules,
    SisCapability.ManageClassSchedules,
    SisCapability.ViewStudents,
    SisCapability.ManageStudents,
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
    AdmissionsCapability.ManageLeads,
    AdmissionsCapability.ViewLeads,
    AdmissionsCapability.ManageTasters,
    AdmissionsCapability.ManageApplications,
    SisCapability.ViewBranches,
    SisCapability.ManageBranches,
    SisCapability.ViewClassSchedules,
    SisCapability.ManageClassSchedules,
    SisCapability.ViewStudents,
    SisCapability.ManageStudents,
    'operations:branches',
    'operations:rostering',
    'operations:attendance',
    'finance:view',
    'communications:send',
    'analytics:view',
    'tasks:view',
  ],
  OPERATIONS_MANAGER: [
    AdmissionsCapability.ViewLeads,
    AdmissionsCapability.ManageTasters,
    SisCapability.ViewBranches,
    SisCapability.ManageBranches,
    SisCapability.ViewClassSchedules,
    SisCapability.ManageClassSchedules,
    SisCapability.ViewStudents,
    SisCapability.ManageStudents,
    'operations:branches',
    'operations:rostering',
    'operations:attendance',
    'analytics:view',
    'tasks:manage',
    'tasks:view',
  ],
  BRANCH_MANAGER: [
    AdmissionsCapability.ManageLeads,
    AdmissionsCapability.ViewLeads,
    AdmissionsCapability.ManageTasters,
    AdmissionsCapability.ManageApplications,
    SisCapability.ViewBranches,
    SisCapability.ManageBranches,
    SisCapability.ViewClassSchedules,
    SisCapability.ManageClassSchedules,
    SisCapability.ViewStudents,
    SisCapability.ManageStudents,
    'operations:rostering',
    'operations:attendance',
    'communications:send',
    'tasks:manage',
    'tasks:view',
  ],
  ADMISSIONS_OFFICER: [
    AdmissionsCapability.ManageLeads,
    AdmissionsCapability.ViewLeads,
    AdmissionsCapability.ManageTasters,
    AdmissionsCapability.ManageApplications,
    SisCapability.ViewStudents,
    SisCapability.ManageStudents,
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
    SisCapability.ViewClassSchedules,
    SisCapability.ViewStudents,
    'tasks:view',
  ],
  TEACHING_ASSISTANT: [
    'operations:attendance',
    'lms:teaching',
    SisCapability.ViewClassSchedules,
    'tasks:view',
  ],
  TRAINER: [
    'lms:training',
    'communications:send',
    'tasks:manage',
  ],
  TRAINEE: ['lms:training', 'tasks:view'],
  SUPPORT_STAFF: ['operations:attendance', SisCapability.ViewClassSchedules, 'tasks:view'],
  PARENT_GUARDIAN: ['payments:process', 'tasks:view'],
  STUDENT: ['lms:teaching', 'tasks:view'],
};

export const hasCapability = (role: Role, capability: Capability): boolean =>
  ROLE_CAPABILITIES[role]?.includes(capability) ?? false;

export const hasAnyCapability = (role: Role, capabilities: Capability[]): boolean =>
  capabilities.some((capability) => hasCapability(role, capability));
