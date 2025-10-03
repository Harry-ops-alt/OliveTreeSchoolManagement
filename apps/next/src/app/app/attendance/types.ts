export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceSessionSummary = {
  id: string;
  date: string;
  status: string;
  branch: {
    id: string;
    name: string;
  };
  classSchedule?: {
    id: string;
    title: string;
  } | null;
  statusCounts: Partial<Record<AttendanceStatus, number>>;
  notes?: string | null;
};

export type AttendanceRecordDetail = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: AttendanceStatus;
  notes?: string | null;
  recordedAt?: string | null;
};

export type AttendanceSessionDetail = {
  id: string;
  date: string;
  status: string;
  branchName: string;
  classScheduleTitle?: string | null;
  notes?: string | null;
  submittedAt?: string | null;
  finalizedAt?: string | null;
  records: AttendanceRecordDetail[];
};
