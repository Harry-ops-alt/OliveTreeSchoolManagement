export type Teacher = {
  id: string;
  userId: string;
  branchId: string;
  hireDate: string;
  subjects: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  branch: {
    id: string;
    name: string;
  };
  classSchedules?: Array<{
    id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
};

export type CreateTeacherInput = {
  userId: string;
  branchId: string;
  hireDate?: string;
  subjects?: string[];
};

export type UpdateTeacherInput = Partial<CreateTeacherInput>;

export type ListTeachersParams = {
  q?: string;
  branchId?: string;
  subject?: string;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type ListTeachersResponse = {
  items: Teacher[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};
