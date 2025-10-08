export type StudentFormClassroomOption = {
  id: string;
  name: string;
};

export type StudentFormClassScheduleOption = {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export type StudentFormBranchOption = {
  id: string;
  name: string;
  classrooms: StudentFormClassroomOption[];
  classSchedules: StudentFormClassScheduleOption[];
};
