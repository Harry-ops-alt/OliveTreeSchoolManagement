export type AdmissionLeadStage =
  | 'NEW'
  | 'CONTACTED'
  | 'TASTER_BOOKED'
  | 'ATTENDED'
  | 'OFFER'
  | 'ACCEPTED'
  | 'ENROLLED'
  | 'ONBOARDED';

export type AdmissionContactChannel = 'CALL' | 'EMAIL' | 'SMS' | 'IN_PERSON' | 'NOTE';

export type AdmissionTasterStatus = 'INVITED' | 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';

export type AdmissionApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'OFFER_SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type AdmissionDecision = 'OFFERED' | 'WAITLISTED' | 'REJECTED';

export type AdmissionTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type BranchSummary = {
  id: string;
  name: string;
};

export type ClassroomSummary = {
  id: string;
  name: string;
};

export type UserSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type UserWithRoleSummary = UserSummary & {
  role: string | null;
};

export type AdmissionLeadContact = {
  id: string;
  leadId: string;
  userId: string | null;
  channel: AdmissionContactChannel;
  summary: string;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
  user: UserSummary | null;
};

export type AdmissionLeadStageHistory = {
  id: string;
  leadId: string;
  fromStage: AdmissionLeadStage | null;
  toStage: AdmissionLeadStage;
  changedById: string | null;
  reason: string | null;
  changedAt: string;
  metadata: Record<string, unknown> | null;
  changedBy: UserSummary | null;
};

export type AdmissionTasterLeadSummary = {
  id: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  stage: AdmissionLeadStage;
};

export type AdmissionTasterAttendee = {
  id: string;
  tasterId: string;
  leadId: string;
  status: AdmissionTasterStatus;
  notes: string | null;
  attendedAt: string | null;
  lead: AdmissionTasterLeadSummary;
};

export type AdmissionTasterSession = {
  id: string;
  branchId: string;
  classroomId: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number | null;
  assignedStaffId: string | null;
  branch: BranchSummary;
  classroom: ClassroomSummary | null;
  assignedStaff: UserSummary | null;
  attendees: AdmissionTasterAttendee[];
  createdAt: string;
  updatedAt: string;
};

export type AdmissionOfferLetter = {
  id: string;
  applicationId: string;
  templateKey: string;
  issuedAt: string;
  expiresAt: string | null;
  signedAt: string | null;
  signedById: string | null;
  stripeSessionId: string | null;
  metadata: Record<string, unknown> | null;
  signedBy: UserSummary | null;
};

export type AdmissionTask = {
  id: string;
  leadId: string | null;
  applicationId: string | null;
  title: string;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  createdById: string | null;
  status: AdmissionTaskStatus;
  metadata: Record<string, unknown> | null;
  assignee: UserSummary | null;
  createdBy: UserSummary | null;
};

export type AdmissionApplication = {
  id: string;
  leadId: string;
  branchId: string | null;
  yearGroup: string | null;
  requestedStart: string | null;
  status: AdmissionApplicationStatus;
  submittedAt: string | null;
  reviewedById: string | null;
  decision: AdmissionDecision | null;
  decisionNotes: string | null;
  decisionAt: string | null;
  extraData: Record<string, unknown> | null;
  branch: BranchSummary | null;
  reviewedBy: UserSummary | null;
  offer: AdmissionOfferLetter | null;
  tasks: AdmissionTask[];
  createdAt: string;
  updatedAt: string;
};

export type AdmissionLeadTaster = AdmissionTasterAttendee & {
  taster: Pick<AdmissionTasterSession, 'id' | 'title' | 'startTime' | 'endTime' | 'branchId' | 'classroomId'>;
};

export type AdmissionLead = {
  id: string;
  branchId: string | null;
  assignedStaffId: string | null;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentDateOfBirth: string | null;
  programmeInterest: string | null;
  preferredContactAt: string | null;
  source: string | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown> | null;
  stage: AdmissionLeadStage;
  createdAt: string;
  updatedAt: string;
  branch: BranchSummary | null;
  assignedStaff: UserWithRoleSummary | null;
  contacts: AdmissionLeadContact[];
  stageHistory: AdmissionLeadStageHistory[];
  tastings: AdmissionLeadTaster[];
  application: AdmissionApplication | null;
  tasks: AdmissionTask[];
};

export type AdmissionLeadListResponse = {
  total: number;
  page: number;
  pageSize: number;
  items: AdmissionLead[];
};

export type AdmissionLeadListParams = {
  branchId?: string;
  branchIds?: string[];
  stage?: AdmissionLeadStage;
  stages?: AdmissionLeadStage[];
  assignedStaffId?: string;
  assignedStaffIds?: string[];
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AdmissionLeadSavedView = {
  id: string;
  name: string;
  filters: Partial<AdmissionLeadListParams>;
  isDefault: boolean;
  sharedWithOrg: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdmissionTaskStatusUpdate = {
  status: AdmissionTaskStatus;
};
