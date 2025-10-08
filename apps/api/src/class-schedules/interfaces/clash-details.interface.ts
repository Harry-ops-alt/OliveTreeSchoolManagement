import { DayOfWeek } from '@prisma/client';

export interface ClassScheduleSummary {
  id: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  classroom: {
    id: string;
    name: string;
  } | null;
  teacherProfile: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
  } | null;
}

export interface StaffAssignmentClash {
  schedule: ClassScheduleSummary;
  userIds: string[];
}

export interface ClassScheduleClashDetails {
  classroom: ClassScheduleSummary[];
  teacherProfiles: ClassScheduleSummary[];
  staffAssignments: StaffAssignmentClash[];
}
