export type Branch = {
  id: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  timezone?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Classroom = {
  id: string;
  branchId: string;
  name: string;
  capacity?: number | null;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBranchPayload = {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type UpdateBranchPayload = Partial<CreateBranchPayload> & {
  name?: string;
};

export type CreateClassroomPayload = {
  name: string;
  capacity?: number;
  location?: string;
  notes?: string;
};

export type UpdateClassroomPayload = Partial<CreateClassroomPayload> & {
  name?: string;
};
