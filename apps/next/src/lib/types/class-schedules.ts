export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type StaffAssignmentRole = 'LEAD_TEACHER' | 'ASSISTANT' | 'SUBSTITUTE' | 'SUPPORT';

export type UserSummary = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type TeacherProfileSummary = {
  id: string;
  branchId: string;
  user: UserSummary | null;
};

export type ClassroomSummary = {
  id: string;
  branchId: string;
  name: string;
  location?: string | null;
  capacity?: number | null;
};

export type StaffAssignmentSummary = {
  id: string;
  scheduleId: string;
  role: StaffAssignmentRole;
  user: UserSummary | null;
};

export type ClassSchedule = {
  id: string;
  branchId: string;
  classroomId?: string | null;
  teacherProfileId?: string | null;
  title: string;
  description?: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  classroom: ClassroomSummary | null;
  teacherProfile: TeacherProfileSummary | null;
  assignments: StaffAssignmentSummary[];
  createdAt: string;
  updatedAt: string;
};

export type StaffAssignmentInput = {
  userId: string;
  role?: StaffAssignmentRole;
  assignedAt?: string;
};

export type CreateClassScheduleInput = {
  title: string;
  description?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  classroomId?: string | null;
  teacherProfileId?: string | null;
  primaryInstructor?: StaffAssignmentInput;
  additionalStaff?: StaffAssignmentInput[];
};

export type UpdateClassScheduleInput = Partial<CreateClassScheduleInput>;

export type ClassScheduleSummary = {
  id: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classroom: Pick<ClassroomSummary, 'id' | 'name'> | null;
  teacherProfile: (TeacherProfileSummary & {
    user: UserSummary | null;
  }) | null;
};

export type StaffAssignmentClash = {
  schedule: ClassScheduleSummary;
  userIds: string[];
};

export type ClassScheduleClashDetails = {
  classroom: ClassScheduleSummary[];
  teacherProfiles: ClassScheduleSummary[];
  staffAssignments: StaffAssignmentClash[];
};

export type ClassScheduleConflictResponse = {
  message: string;
  clashes: ClassScheduleClashDetails;
};
