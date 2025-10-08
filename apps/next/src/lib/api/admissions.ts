import { fetchJson } from './fetch-json';
import type {
  AdmissionApplication,
  AdmissionApplicationStatus,
  AdmissionContactChannel,
  AdmissionDecision,
  AdmissionLead,
  AdmissionLeadListParams,
  AdmissionLeadListResponse,
  AdmissionLeadStage,
  AdmissionLeadSavedView,
  AdmissionTask,
  AdmissionTaskStatus,
  AdmissionTaskStatusUpdate,
  AdmissionTasterSession,
} from '../types/admissions';

const ADMISSIONS_BASE_PATH = '/admissions';

type NullableDateString = string | null;

type Metadata = Record<string, unknown> | null | undefined;

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item));
        }
      });
      continue;
    }

    searchParams.append(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export type CreateLeadPayload = {
  branchId?: string;
  assignedStaffId?: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
  studentFirstName?: string;
  studentLastName?: string;
  studentDateOfBirth?: NullableDateString;
  programmeInterest?: string;
  preferredContactAt?: NullableDateString;
  source?: string;
  notes?: string;
  tags?: string[];
  metadata?: Metadata;
};

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  branchId?: string | null;
  assignedStaffId?: string | null;
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string | null;
  studentFirstName?: string | null;
  studentLastName?: string | null;
  studentDateOfBirth?: NullableDateString;
  preferredContactAt?: NullableDateString;
  programmeInterest?: string | null;
  source?: string | null;
  notes?: string | null;
  metadata?: Metadata;
};

export type RecordLeadContactPayload = {
  channel: AdmissionContactChannel;
  summary: string;
  occurredAt?: string;
  metadata?: Metadata;
};

export type UpdateLeadStagePayload = {
  toStage: AdmissionLeadStage;
  reason?: string;
  assignedStaffId?: string;
};

export type CreateTasterSessionPayload = {
  branchId?: string;
  classroomId?: string;
  assignedStaffId?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity?: number;
};

export type UpdateTasterSessionPayload = Partial<CreateTasterSessionPayload> & {
  branchId?: string;
  classroomId?: string | null;
  assignedStaffId?: string | null;
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string;
  capacity?: number | null;
};

export type AddTasterAttendeePayload = {
  leadId: string;
  status?: string;
  notes?: string;
};

export type UpdateTasterAttendeePayload = {
  status?: string;
  notes?: string | null;
  attendedAt?: NullableDateString;
};

export type CreateApplicationPayload = {
  leadId: string;
  branchId?: string;
  yearGroup?: string;
  requestedStart?: NullableDateString;
  status?: AdmissionApplicationStatus;
  submittedAt?: NullableDateString;
  reviewedById?: string;
  decision?: AdmissionDecision;
  decisionNotes?: string;
  decisionAt?: NullableDateString;
  extraData?: Metadata;
};

export type UpdateApplicationPayload = Partial<CreateApplicationPayload> & {
  branchId?: string | null;
  yearGroup?: string | null;
  requestedStart?: NullableDateString;
  status?: AdmissionApplicationStatus;
  submittedAt?: NullableDateString;
  reviewedById?: string | null;
  decision?: AdmissionDecision | null;
  decisionNotes?: string | null;
  decisionAt?: NullableDateString;
  extraData?: Metadata;
};

export type CreateTaskPayload = {
  leadId?: string;
  applicationId?: string;
  title: string;
  description?: string;
  dueAt?: NullableDateString;
  assigneeId?: string;
  status?: AdmissionTaskStatus;
  metadata?: Metadata;
};

export type UpdateTaskStatusPayload = AdmissionTaskStatusUpdate;

export type BulkUpdateLeadStagePayload = {
  leadIds: string[];
  toStage: AdmissionLeadStage;
  reason?: string;
  assignedStaffId?: string;
};

export type BulkAssignLeadStaffPayload = {
  leadIds: string[];
  assignedStaffId?: string;
};

export type BulkLeadUpdateResponse = {
  updated: AdmissionLead[];
};

export type { AdmissionLeadListParams };

export type CreateLeadViewPayload = {
  name: string;
  filters: Partial<AdmissionLeadListParams>;
  isDefault?: boolean;
  sharedWithOrg?: boolean;
};

export type UpdateLeadViewPayload = Partial<CreateLeadViewPayload>;

const sanitiseListParams = (params?: AdmissionLeadListParams): Record<string, unknown> | undefined => {
  if (!params) {
    return undefined;
  }

  const sanitised: Record<string, unknown> = {
    page: params.page,
    pageSize: params.pageSize,
  };

  const addString = (key: string, value?: string) => {
    if (value?.trim()) {
      sanitised[key] = value.trim();
    }
  };

  const addArray = (key: string, values?: string[]) => {
    if (values && values.length) {
      const filtered = values.map((value) => value.trim()).filter((value) => value.length > 0);
      if (filtered.length) {
        sanitised[key] = filtered;
      }
    }
  };

  addString('branchId', params.branchId);
  addArray('branchIds', params.branchIds);
  addString('stage', params.stage);
  addArray('stages', params.stages);
  addString('assignedStaffId', params.assignedStaffId);
  addArray('assignedStaffIds', params.assignedStaffIds);
  addArray('tags', params.tags);
  addString('search', params.search);

  return sanitised;
};

const sanitiseSavedViewFilters = (
  filters: Partial<AdmissionLeadListParams>,
): Record<string, unknown> => {
  const sanitised = sanitiseListParams({
    ...filters,
    page: undefined,
    pageSize: undefined,
  } as AdmissionLeadListParams);

  return sanitised ?? {};
};

export async function listAdmissionLeads(
  params?: AdmissionLeadListParams,
): Promise<AdmissionLeadListResponse> {
  const query = buildQueryString(sanitiseListParams(params));
  return fetchJson<AdmissionLeadListResponse>(`${ADMISSIONS_BASE_PATH}/leads${query}`);
}

export async function listAdmissionLeadViews(params?: { branchId?: string }): Promise<AdmissionLeadSavedView[]> {
  const query = buildQueryString(params);
  return fetchJson<AdmissionLeadSavedView[]>(`${ADMISSIONS_BASE_PATH}/leads/views${query}`);
}

export async function createAdmissionLeadView(
  payload: CreateLeadViewPayload,
): Promise<AdmissionLeadSavedView> {
  const body: Record<string, unknown> = {
    name: payload.name.trim(),
    filters: sanitiseSavedViewFilters(payload.filters ?? {}),
  };

  if (payload.isDefault !== undefined) {
    body.isDefault = payload.isDefault;
  }
  if (payload.sharedWithOrg !== undefined) {
    body.sharedWithOrg = payload.sharedWithOrg;
  }

  return fetchJson<AdmissionLeadSavedView>(`${ADMISSIONS_BASE_PATH}/leads/views`, {
    method: 'POST',
    body,
  });
}

export async function updateAdmissionLeadView(
  id: string,
  payload: UpdateLeadViewPayload,
): Promise<AdmissionLeadSavedView> {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    body.name = payload.name.trim();
  }

  if (payload.filters !== undefined) {
    body.filters = sanitiseSavedViewFilters(payload.filters ?? {});
  }

  if (payload.isDefault !== undefined) {
    body.isDefault = payload.isDefault;
  }

  if (payload.sharedWithOrg !== undefined) {
    body.sharedWithOrg = payload.sharedWithOrg;
  }

  return fetchJson<AdmissionLeadSavedView>(`${ADMISSIONS_BASE_PATH}/leads/views/${id}`, {
    method: 'PATCH',
    body,
  });
}

export async function deleteAdmissionLeadView(id: string): Promise<{ id: string }> {
  return fetchJson<{ id: string }>(`${ADMISSIONS_BASE_PATH}/leads/views/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkUpdateAdmissionLeadStage(
  payload: BulkUpdateLeadStagePayload,
): Promise<BulkLeadUpdateResponse> {
  return fetchJson<BulkLeadUpdateResponse>(`${ADMISSIONS_BASE_PATH}/leads/bulk-stage`, {
    method: 'POST',
    body: payload,
  });
}

export async function bulkAssignAdmissionLeadStaff(
  payload: BulkAssignLeadStaffPayload,
): Promise<BulkLeadUpdateResponse> {
  return fetchJson<BulkLeadUpdateResponse>(`${ADMISSIONS_BASE_PATH}/leads/bulk-assign`, {
    method: 'POST',
    body: payload,
  });
}

export async function getAdmissionLead(id: string): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/leads/${id}`);
}

export async function createAdmissionLead(payload: CreateLeadPayload): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/leads`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdmissionLead(
  id: string,
  payload: UpdateLeadPayload,
): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/leads/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function recordAdmissionLeadContact(
  id: string,
  payload: RecordLeadContactPayload,
): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/leads/${id}/contacts`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdmissionLeadStage(
  id: string,
  payload: UpdateLeadStagePayload,
): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/leads/${id}/stage`, {
    method: 'POST',
    body: payload,
  });
}

export async function listAdmissionTasters(branchId?: string): Promise<AdmissionTasterSession[]> {
  const query = buildQueryString(branchId ? { branchId } : undefined);
  return fetchJson<AdmissionTasterSession[]>(`${ADMISSIONS_BASE_PATH}/tasters${query}`);
}

export async function createAdmissionTaster(
  payload: CreateTasterSessionPayload,
): Promise<AdmissionTasterSession> {
  return fetchJson<AdmissionTasterSession>(`${ADMISSIONS_BASE_PATH}/tasters`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdmissionTaster(
  id: string,
  payload: UpdateTasterSessionPayload,
): Promise<AdmissionTasterSession> {
  return fetchJson<AdmissionTasterSession>(`${ADMISSIONS_BASE_PATH}/tasters/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function addAdmissionTasterAttendee(
  tasterId: string,
  payload: AddTasterAttendeePayload,
): Promise<AdmissionTasterSession> {
  return fetchJson<AdmissionTasterSession>(`${ADMISSIONS_BASE_PATH}/tasters/${tasterId}/attendees`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdmissionTasterAttendee(
  tasterId: string,
  attendeeId: string,
  payload: UpdateTasterAttendeePayload,
): Promise<AdmissionTasterSession> {
  return fetchJson<AdmissionTasterSession>(
    `${ADMISSIONS_BASE_PATH}/tasters/${tasterId}/attendees/${attendeeId}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function createAdmissionApplication(
  payload: CreateApplicationPayload,
): Promise<AdmissionApplication> {
  return fetchJson<AdmissionApplication>(`${ADMISSIONS_BASE_PATH}/applications`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdmissionApplication(
  id: string,
  payload: UpdateApplicationPayload,
): Promise<AdmissionApplication> {
  return fetchJson<AdmissionApplication>(`${ADMISSIONS_BASE_PATH}/applications/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function createAdmissionTask(payload: CreateTaskPayload): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/tasks`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdmissionTaskStatus(
  id: string,
  payload: UpdateTaskStatusPayload,
): Promise<AdmissionLead> {
  return fetchJson<AdmissionLead>(`${ADMISSIONS_BASE_PATH}/tasks/${id}/status`, {
    method: 'PATCH',
    body: payload,
  });
}
