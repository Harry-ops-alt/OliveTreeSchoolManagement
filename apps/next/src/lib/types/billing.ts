// Enums
export type BillingCycle = 'MONTHLY' | 'TERMLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD_MANUAL' | 'STRIPE';
export type DiscountType = 'SIBLING' | 'BURSARY' | 'SCHOLARSHIP' | 'PROMOTIONAL' | 'EARLY_BIRD';

// Fee Structure
export type FeeStructure = {
  id: string;
  organizationId: string;
  branchId?: string | null;
  classId?: string | null;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  yearGroup?: string | null;
  active: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  } | null;
  class?: {
    id: string;
    name: string;
    code?: string | null;
  } | null;
};

export type CreateFeeStructureInput = {
  organizationId: string;
  branchId?: string | null;
  classId?: string | null;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  yearGroup?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateFeeStructureInput = Partial<Omit<CreateFeeStructureInput, 'organizationId'>> & {
  active?: boolean;
};

export type ListFeeStructuresParams = {
  q?: string;
  branchId?: string;
  classId?: string;
  billingCycle?: BillingCycle;
  yearGroup?: string;
  active?: string;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type ListFeeStructuresResponse = {
  items: FeeStructure[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

// Subscription
export type Subscription = {
  id: string;
  studentId: string;
  feeStructureId: string;
  startDate: string;
  endDate?: string | null;
  status: SubscriptionStatus;
  amount: number;
  discountAmount: number;
  discountReason?: string | null;
  billingCycle: BillingCycle;
  nextBillingDate?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentNumber: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    branch: {
      id: string;
      name: string;
    };
  };
  feeStructure?: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    billingCycle: BillingCycle;
  };
};

export type CreateSubscriptionInput = {
  studentId: string;
  feeStructureId: string;
  startDate: string;
  endDate?: string | null;
  discountAmount?: number;
  discountReason?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateSubscriptionInput = {
  endDate?: string | null;
  status?: SubscriptionStatus;
  amount?: number;
  discountAmount?: number;
  discountReason?: string;
  nextBillingDate?: string | null;
  metadata?: Record<string, unknown>;
};

export type ListSubscriptionsParams = {
  q?: string;
  studentId?: string;
  branchId?: string;
  status?: SubscriptionStatus;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type ListSubscriptionsResponse = {
  items: Subscription[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

// Invoice
export type InvoiceLineItem = {
  description: string;
  amount: number;
  quantity?: number;
};

export type Invoice = {
  id: string;
  subscriptionId?: string | null;
  studentId: string;
  parentId?: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  currency: string;
  lineItems: InvoiceLineItem[];
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    studentNumber: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  subscription?: {
    id: string;
    feeStructure: {
      name: string;
    };
  } | null;
  payments?: Payment[];
};

export type CreateInvoiceInput = {
  subscriptionId?: string | null;
  studentId: string;
  parentId?: string | null;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type UpdateInvoiceInput = {
  status?: InvoiceStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type ListInvoicesParams = {
  q?: string;
  studentId?: string;
  branchId?: string;
  status?: InvoiceStatus;
  fromDate?: string;
  toDate?: string;
  overdue?: string;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type ListInvoicesResponse = {
  items: Invoice[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

// Payment
export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
  recordedById: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type ListPaymentsParams = {
  invoiceId?: string;
  studentId?: string;
  paymentMethod?: PaymentMethod;
  fromDate?: string;
  toDate?: string;
  order?: string;
  page?: number;
  pageSize?: number;
};

export type ListPaymentsResponse = {
  items: Payment[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

// Discount
export type Discount = {
  id: string;
  organizationId: string;
  code?: string | null;
  name: string;
  type: DiscountType;
  percentage?: number | null;
  fixedAmount?: number | null;
  criteria?: Record<string, unknown> | null;
  active: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDiscountInput = {
  organizationId: string;
  code?: string | null;
  name: string;
  type: DiscountType;
  percentage?: number | null;
  fixedAmount?: number | null;
  criteria?: Record<string, unknown>;
  validFrom?: string | null;
  validTo?: string | null;
};

// Payment Plan
export type PaymentPlanInstallment = {
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID';
};

export type PaymentPlan = {
  id: string;
  invoiceId: string;
  totalAmount: number;
  installments: PaymentPlanInstallment[];
  status: string;
  createdAt: string;
  updatedAt: string;
  invoice?: Invoice;
};

export type CreatePaymentPlanInput = {
  invoiceId: string;
  installmentCount: number;
  startDate: string;
};
