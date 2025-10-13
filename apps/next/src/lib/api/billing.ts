import { fetchJson } from './fetch-json';
import type {
  FeeStructure,
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  ListFeeStructuresParams,
  ListFeeStructuresResponse,
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  ListSubscriptionsParams,
  ListSubscriptionsResponse,
  Invoice,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesParams,
  ListInvoicesResponse,
  Payment,
  RecordPaymentInput,
  ListPaymentsParams,
  ListPaymentsResponse,
  Discount,
  CreateDiscountInput,
  PaymentPlan,
  CreatePaymentPlanInput,
} from '../types/billing';

// Fee Structures
export async function listFeeStructures(params?: ListFeeStructuresParams): Promise<ListFeeStructuresResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.classId) searchParams.set('classId', params.classId);
  if (params?.billingCycle) searchParams.set('billingCycle', params.billingCycle);
  if (params?.yearGroup) searchParams.set('yearGroup', params.yearGroup);
  if (params?.active !== undefined) searchParams.set('active', params.active);
  if (params?.order) searchParams.set('order', params.order);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return fetchJson<ListFeeStructuresResponse>(query ? `/fee-structures?${query}` : '/fee-structures');
}

export async function getFeeStructure(id: string): Promise<FeeStructure> {
  return fetchJson<FeeStructure>(`/fee-structures/${id}`);
}

export async function createFeeStructure(data: CreateFeeStructureInput): Promise<FeeStructure> {
  return fetchJson<FeeStructure>('/fee-structures', { method: 'POST', body: data });
}

export async function updateFeeStructure(id: string, data: UpdateFeeStructureInput): Promise<FeeStructure> {
  return fetchJson<FeeStructure>(`/fee-structures/${id}`, { method: 'PATCH', body: data });
}

export async function archiveFeeStructure(id: string): Promise<FeeStructure> {
  return fetchJson<FeeStructure>(`/fee-structures/${id}`, { method: 'DELETE' });
}

// Subscriptions
export async function listSubscriptions(params?: ListSubscriptionsParams): Promise<ListSubscriptionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.studentId) searchParams.set('studentId', params.studentId);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.order) searchParams.set('order', params.order);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return fetchJson<ListSubscriptionsResponse>(query ? `/subscriptions?${query}` : '/subscriptions');
}

export async function getSubscription(id: string): Promise<Subscription> {
  return fetchJson<Subscription>(`/subscriptions/${id}`);
}

export async function createSubscription(data: CreateSubscriptionInput): Promise<Subscription> {
  return fetchJson<Subscription>('/subscriptions', { method: 'POST', body: data });
}

export async function updateSubscription(id: string, data: UpdateSubscriptionInput): Promise<Subscription> {
  return fetchJson<Subscription>(`/subscriptions/${id}`, { method: 'PATCH', body: data });
}

export async function cancelSubscription(id: string, reason?: string): Promise<Subscription> {
  return fetchJson<Subscription>(`/subscriptions/${id}`, { method: 'DELETE', body: { reason } });
}

// Invoices
export async function listInvoices(params?: ListInvoicesParams): Promise<ListInvoicesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.studentId) searchParams.set('studentId', params.studentId);
  if (params?.branchId) searchParams.set('branchId', params.branchId);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) searchParams.set('toDate', params.toDate);
  if (params?.overdue) searchParams.set('overdue', params.overdue);
  if (params?.order) searchParams.set('order', params.order);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return fetchJson<ListInvoicesResponse>(query ? `/invoices?${query}` : '/invoices');
}

export async function getInvoice(id: string): Promise<Invoice> {
  return fetchJson<Invoice>(`/invoices/${id}`);
}

export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  return fetchJson<Invoice>('/invoices', { method: 'POST', body: data });
}

export async function generateInvoiceFromSubscription(
  subscriptionId: string,
  periodStart: string,
  periodEnd: string,
): Promise<Invoice> {
  return fetchJson<Invoice>('/invoices/generate-from-subscription', {
    method: 'POST',
    body: { subscriptionId, periodStart, periodEnd },
  });
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput): Promise<Invoice> {
  return fetchJson<Invoice>(`/invoices/${id}`, { method: 'PATCH', body: data });
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  return fetchJson<Invoice>(`/invoices/${id}`, { method: 'DELETE' });
}

export async function markInvoicesOverdue(): Promise<{ count: number }> {
  return fetchJson<{ count: number }>('/invoices/mark-overdue', { method: 'POST' });
}

// Payments
export async function listPayments(params?: ListPaymentsParams): Promise<ListPaymentsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.invoiceId) searchParams.set('invoiceId', params.invoiceId);
  if (params?.studentId) searchParams.set('studentId', params.studentId);
  if (params?.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod);
  if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
  if (params?.toDate) searchParams.set('toDate', params.toDate);
  if (params?.order) searchParams.set('order', params.order);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return fetchJson<ListPaymentsResponse>(query ? `/payments?${query}` : '/payments');
}

export async function getPayment(id: string): Promise<Payment> {
  return fetchJson<Payment>(`/payments/${id}`);
}

export async function recordPayment(data: RecordPaymentInput): Promise<Payment> {
  return fetchJson<Payment>('/payments', { method: 'POST', body: data });
}

export async function refundPayment(id: string, amount: number, reason: string): Promise<Payment> {
  return fetchJson<Payment>(`/payments/${id}/refund`, { method: 'POST', body: { amount, reason } });
}

// Discounts
export async function listDiscounts(organizationId: string, active?: boolean): Promise<Discount[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('organizationId', organizationId);
  if (active !== undefined) searchParams.set('active', String(active));

  return fetchJson<Discount[]>(`/discounts?${searchParams.toString()}`);
}

export async function getDiscount(id: string): Promise<Discount> {
  return fetchJson<Discount>(`/discounts/${id}`);
}

export async function createDiscount(data: CreateDiscountInput): Promise<Discount> {
  return fetchJson<Discount>('/discounts', { method: 'POST', body: data });
}

export async function validateDiscount(code: string, studentId: string): Promise<Discount> {
  return fetchJson<Discount>('/discounts/validate', { method: 'POST', body: { code, studentId } });
}

// Payment Plans
export async function getPaymentPlanByInvoice(invoiceId: string): Promise<PaymentPlan> {
  return fetchJson<PaymentPlan>(`/payment-plans/invoice/${invoiceId}`);
}

export async function createPaymentPlan(data: CreatePaymentPlanInput): Promise<PaymentPlan> {
  return fetchJson<PaymentPlan>('/payment-plans', { method: 'POST', body: data });
}

export async function markInstallmentPaid(planId: string, installmentIndex: number): Promise<PaymentPlan> {
  return fetchJson<PaymentPlan>(`/payment-plans/${planId}/installments/${installmentIndex}/mark-paid`, {
    method: 'POST',
  });
}
