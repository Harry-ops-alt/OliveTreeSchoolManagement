export type Class = {
  id: string;
  branchId: string;
  classroomId?: string | null;
  name: string;
  code?: string | null;
  capacity: number;
  yearGroup?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  metadata?: Record<string, unknown> | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateClassInput = {
  branchId: string;
  classroomId?: string | null;
  name: string;
  code?: string | null;
  capacity: number;
  yearGroup?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateClassInput = Partial<CreateClassInput> & {
  isDeleted?: boolean;
};

export type ListClassesParams = {
  q?: string;
  branchId?: string;
  classroomId?: string;
  active?: boolean;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type ListClassesResponse = {
  items: Class[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};
