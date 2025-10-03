'use client';

import { useMemo, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  CreateStudentPayload,
  GuardianLinkInput,
  InlineGuardianInput,
  UpdateGuardianLinkInput,
  UpdateInlineGuardianInput,
  UpdateStudentPayload,
} from '../../lib/api/students';

const STUDENT_STATUS_OPTIONS = [
  'PROSPECT',
  'APPLIED',
  'ENROLLED',
  'INACTIVE',
  'GRADUATED',
  'WITHDRAWN',
  'ARCHIVED',
] as const;

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'NON_BINARY', 'UNSPECIFIED'] as const;

type GuardianField = {
  linkId?: string;
  guardianId: string;
  relationship?: string;
  isPrimary: boolean;
  order?: number | '';
};

type InlineGuardianField = {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  relationship?: string;
  isPrimary: boolean;
  order?: number | '';
};

export type StudentFormValues = {
  orgId: string;
  branchId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  dateJoined?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  enrollmentDate?: string;
  status?: string;
  dateOfBirth?: string;
  gender?: string;
  gradeLevel?: string;
  homeroom?: string;
  primaryLanguage?: string;
  additionalSupportNotes?: string;
  medicalNotes?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  guardians: GuardianField[];
  inlineGuardians: InlineGuardianField[];
};

export interface StudentFormProps {
  mode: 'create' | 'update';
  orgId: string;
  initialValues?: Partial<StudentFormValues>;
  onSubmitCreate: (payload: CreateStudentPayload) => Promise<void>;
  onSubmitUpdate: (payload: UpdateStudentPayload) => Promise<void>;
}

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function trimmedOrNull(value?: string | null): string | null {
  const trimmed = trimmedOrUndefined(value);
  return trimmed ?? null;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function numberOrNull(value: unknown): number | null {
  const parsed = numberOrUndefined(value);
  return parsed ?? null;
}

const optionalString = (max: number) =>
  z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().max(max).optional(),
  );

const optionalUUID = () =>
  z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().uuid().optional(),
  );

const optionalDate = () =>
  z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date')
      .optional(),
  );

const optionalPhone = () =>
  z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().min(7, 'Enter at least 7 digits').max(20, 'Enter at most 20 digits').optional(),
  );

const optionalOrder = () =>
  z.preprocess((val) => numberOrUndefined(val), z.number().int().min(0).max(99).optional());

const statusSchema = z.preprocess(
  (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
  z.enum(STUDENT_STATUS_OPTIONS).optional(),
);

const genderSchema = z.preprocess(
  (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
  z.enum(GENDER_OPTIONS).optional(),
);

const guardianLinkSchema = z.object({
  linkId: optionalUUID(),
  guardianId: z
    .string({ required_error: 'Guardian is required' })
    .uuid('Guardian must be a valid UUID'),
  relationship: optionalString(64),
  isPrimary: z.boolean().optional(),
  order: optionalOrder(),
});

const inlineGuardianSchema = z.object({
  id: optionalUUID(),
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(80, 'First name must be 80 characters or fewer'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(80, 'Last name must be 80 characters or fewer'),
  email: z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().email('Enter a valid email').max(120).optional(),
  ),
  phone: optionalPhone(),
  alternatePhone: optionalPhone(),
  addressLine1: optionalString(120),
  addressLine2: optionalString(120),
  city: optionalString(80),
  state: optionalString(80),
  postalCode: z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().min(3, 'Postal code must be at least 3 characters').max(12, 'Postal code must be at most 12 characters').optional(),
  ),
  country: optionalString(2),
  notes: optionalString(500),
  relationship: optionalString(64),
  isPrimary: z.boolean().optional(),
  order: optionalOrder(),
});

const studentFormSchema = z.object({
  orgId: z.string().uuid(),
  branchId: z.string({ required_error: 'Branch is required' }).uuid('Branch must be a valid UUID'),
  userId: optionalUUID(),
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(80, 'First name must be 80 characters or fewer'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(80, 'Last name must be 80 characters or fewer'),
  studentNumber: z
    .string()
    .trim()
    .min(1, 'Student number is required')
    .max(40, 'Student number must be 40 characters or fewer'),
  dateJoined: optionalDate(),
  email: z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().email('Enter a valid email').max(120).optional(),
  ),
  phone: optionalPhone(),
  alternatePhone: optionalPhone(),
  enrollmentDate: optionalDate(),
  status: statusSchema,
  dateOfBirth: optionalDate(),
  gender: genderSchema,
  gradeLevel: optionalString(40),
  homeroom: optionalString(40),
  primaryLanguage: optionalString(40),
  additionalSupportNotes: optionalString(500),
  medicalNotes: optionalString(500),
  addressLine1: optionalString(120),
  addressLine2: optionalString(120),
  city: optionalString(80),
  state: optionalString(80),
  postalCode: z.preprocess(
    (val) => (typeof val === 'string' ? trimmedOrUndefined(val) : undefined),
    z.string().min(3, 'Postal code must be at least 3 characters').max(12, 'Postal code must be at most 12 characters').optional(),
  ),
  country: optionalString(2),
  notes: optionalString(500),
  guardians: z.array(guardianLinkSchema).max(5).default([]),
  inlineGuardians: z.array(inlineGuardianSchema).max(5).default([]),
});

function mapGuardian(defaultValue: Partial<GuardianField>): GuardianField {
  return {
    linkId: defaultValue.linkId,
    guardianId: defaultValue.guardianId ?? '',
    relationship: defaultValue.relationship,
    isPrimary: defaultValue.isPrimary ?? false,
    order: defaultValue.order,
  };
}

function mapInlineGuardian(defaultValue: Partial<InlineGuardianField>): InlineGuardianField {
  return {
    id: defaultValue.id,
    firstName: defaultValue.firstName ?? '',
    lastName: defaultValue.lastName ?? '',
    email: defaultValue.email,
    phone: defaultValue.phone,
    alternatePhone: defaultValue.alternatePhone,
    addressLine1: defaultValue.addressLine1,
    addressLine2: defaultValue.addressLine2,
    city: defaultValue.city,
    state: defaultValue.state,
    postalCode: defaultValue.postalCode,
    country: defaultValue.country,
    notes: defaultValue.notes,
    relationship: defaultValue.relationship,
    isPrimary: defaultValue.isPrimary ?? false,
    order: defaultValue.order,
  };
}

function buildDefaultValues(orgId: string, overrides?: Partial<StudentFormValues>): StudentFormValues {
  return {
    orgId,
    branchId: overrides?.branchId ?? '',
    userId: overrides?.userId,
    firstName: overrides?.firstName ?? '',
    lastName: overrides?.lastName ?? '',
    studentNumber: overrides?.studentNumber ?? '',
    dateJoined: overrides?.dateJoined,
    email: overrides?.email,
    phone: overrides?.phone,
    alternatePhone: overrides?.alternatePhone,
    enrollmentDate: overrides?.enrollmentDate,
    status: overrides?.status,
    dateOfBirth: overrides?.dateOfBirth,
    gender: overrides?.gender,
    gradeLevel: overrides?.gradeLevel,
    homeroom: overrides?.homeroom,
    primaryLanguage: overrides?.primaryLanguage,
    additionalSupportNotes: overrides?.additionalSupportNotes,
    medicalNotes: overrides?.medicalNotes,
    addressLine1: overrides?.addressLine1,
    addressLine2: overrides?.addressLine2,
    city: overrides?.city,
    state: overrides?.state,
    postalCode: overrides?.postalCode,
    country: overrides?.country,
    notes: overrides?.notes,
    guardians: (overrides?.guardians ?? []).map(mapGuardian),
    inlineGuardians: (overrides?.inlineGuardians ?? []).map(mapInlineGuardian),
  };
}

function buildGuardianPayload(value: GuardianField, mode: 'create' | 'update'): GuardianLinkInput | UpdateGuardianLinkInput {
  if (mode === 'create') {
    const payload: GuardianLinkInput = {
      guardianId: value.guardianId,
      relationship: trimmedOrNull(value.relationship),
      isPrimary: value.isPrimary ?? false,
      order: numberOrNull(value.order),
    };
    return payload;
  }

  const payload: UpdateGuardianLinkInput = {
    linkId: trimmedOrUndefined(value.linkId),
    guardianId: trimmedOrUndefined(value.guardianId),
    relationship: trimmedOrNull(value.relationship),
    isPrimary: value.isPrimary ?? false,
    order: numberOrNull(value.order),
  };
  return payload;
}

function buildInlineGuardianPayload(value: InlineGuardianField): InlineGuardianInput | UpdateInlineGuardianInput {
  return {
    id: trimmedOrUndefined(value.id),
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    email: trimmedOrNull(value.email),
    phone: trimmedOrNull(value.phone),
    alternatePhone: trimmedOrNull(value.alternatePhone),
    addressLine1: trimmedOrNull(value.addressLine1),
    addressLine2: trimmedOrNull(value.addressLine2),
    city: trimmedOrNull(value.city),
    state: trimmedOrNull(value.state),
    postalCode: trimmedOrNull(value.postalCode),
    country: trimmedOrNull(value.country),
    notes: trimmedOrNull(value.notes),
    relationship: trimmedOrNull(value.relationship),
    isPrimary: value.isPrimary ?? false,
    order: numberOrNull(value.order),
  };
}

export function StudentForm({ mode, orgId, initialValues, onSubmitCreate, onSubmitUpdate }: StudentFormProps): JSX.Element {
  const defaultValues = useMemo(() => buildDefaultValues(orgId, initialValues), [orgId, initialValues]);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const guardianArray = useFieldArray({ control, name: 'guardians' });
  const inlineGuardianArray = useFieldArray({ control, name: 'inlineGuardians' });

  const onSubmit = async (values: StudentFormValues) => {
    const trimmedGuardians = values.guardians
      .filter((guardian) => guardian.guardianId.trim().length > 0)
      .map((guardian) => buildGuardianPayload(guardian, mode));
    const inlineGuardians = values.inlineGuardians.map(buildInlineGuardianPayload);

    if (mode === 'create') {
      const payload: CreateStudentPayload = {
        orgId: values.orgId,
        branchId: values.branchId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        studentNumber: values.studentNumber.trim(),
        userId: trimmedOrUndefined(values.userId),
        dateJoined: trimmedOrUndefined(values.dateJoined),
        email: trimmedOrUndefined(values.email),
        phone: trimmedOrUndefined(values.phone),
        alternatePhone: trimmedOrUndefined(values.alternatePhone),
        enrollmentDate: trimmedOrUndefined(values.enrollmentDate),
        status: trimmedOrUndefined(values.status),
        dateOfBirth: trimmedOrUndefined(values.dateOfBirth),
        gender: trimmedOrUndefined(values.gender),
        gradeLevel: trimmedOrUndefined(values.gradeLevel),
        homeroom: trimmedOrUndefined(values.homeroom),
        primaryLanguage: trimmedOrUndefined(values.primaryLanguage),
        additionalSupportNotes: trimmedOrUndefined(values.additionalSupportNotes),
        medicalNotes: trimmedOrUndefined(values.medicalNotes),
        addressLine1: trimmedOrUndefined(values.addressLine1),
        addressLine2: trimmedOrUndefined(values.addressLine2),
        city: trimmedOrUndefined(values.city),
        state: trimmedOrUndefined(values.state),
        postalCode: trimmedOrUndefined(values.postalCode),
        country: trimmedOrUndefined(values.country),
        notes: trimmedOrUndefined(values.notes),
        guardians: (trimmedGuardians as GuardianLinkInput[]).length ? (trimmedGuardians as GuardianLinkInput[]) : undefined,
        inlineGuardians: inlineGuardians.length ? (inlineGuardians as InlineGuardianInput[]) : undefined,
      };

      await onSubmitCreate(payload);
      return;
    }

    const payload: UpdateStudentPayload = {
      branchId: trimmedOrUndefined(values.branchId),
      firstName: trimmedOrUndefined(values.firstName),
      lastName: trimmedOrUndefined(values.lastName),
      studentNumber: trimmedOrUndefined(values.studentNumber),
      dateJoined: trimmedOrUndefined(values.dateJoined),
      email: trimmedOrUndefined(values.email),
      phone: trimmedOrUndefined(values.phone),
      alternatePhone: trimmedOrUndefined(values.alternatePhone),
      enrollmentDate: trimmedOrUndefined(values.enrollmentDate),
      status: trimmedOrUndefined(values.status),
      dateOfBirth: trimmedOrUndefined(values.dateOfBirth),
      gender: trimmedOrUndefined(values.gender),
      gradeLevel: trimmedOrUndefined(values.gradeLevel),
      homeroom: trimmedOrUndefined(values.homeroom),
      primaryLanguage: trimmedOrUndefined(values.primaryLanguage),
      additionalSupportNotes: trimmedOrUndefined(values.additionalSupportNotes),
      medicalNotes: trimmedOrUndefined(values.medicalNotes),
      addressLine1: trimmedOrUndefined(values.addressLine1),
      addressLine2: trimmedOrUndefined(values.addressLine2),
      city: trimmedOrUndefined(values.city),
      state: trimmedOrUndefined(values.state),
      postalCode: trimmedOrUndefined(values.postalCode),
      country: trimmedOrUndefined(values.country),
      notes: trimmedOrUndefined(values.notes),
      guardians: trimmedGuardians.length ? (trimmedGuardians as UpdateGuardianLinkInput[]) : undefined,
      inlineGuardians: inlineGuardians.length ? (inlineGuardians as UpdateInlineGuardianInput[]) : undefined,
    };

    await onSubmitUpdate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" value={orgId} {...register('orgId')} />

      <FormSection
        title="Student profile"
        subtitle="Key identification and enrollment details"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Branch ID" error={errors.branchId?.message}>
            <input
              {...register('branchId')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="Branch UUID"
            />
          </Field>
          <Field label="Student number" error={errors.studentNumber?.message}>
            <input
              {...register('studentNumber')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="STU-2025-001"
            />
          </Field>
          <Field label="First name" error={errors.firstName?.message}>
            <input
              {...register('firstName')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="First name"
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input
              {...register('lastName')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="Last name"
            />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select
              {...register('status')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">Select status</option>
              {STUDENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade level" error={errors.gradeLevel?.message}>
            <input
              {...register('gradeLevel')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="Grade 10"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Contact details" subtitle="Primary communication channels">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="student@olive.school"
            />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input
              type="tel"
              {...register('phone')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="0801 234 5678"
            />
          </Field>
          <Field label="Alternate phone" error={errors.alternatePhone?.message}>
            <input
              type="tel"
              {...register('alternatePhone')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="0802 345 6789"
            />
          </Field>
          <Field label="Primary language" error={errors.primaryLanguage?.message}>
            <input
              {...register('primaryLanguage')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="English"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Address" subtitle="Student home information">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address line 1" error={errors.addressLine1?.message}>
            <input
              {...register('addressLine1')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </Field>
          <Field label="Address line 2" error={errors.addressLine2?.message}>
            <input
              {...register('addressLine2')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </Field>
          <Field label="City" error={errors.city?.message}>
            <input
              {...register('city')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </Field>
          <Field label="State" error={errors.state?.message}>
            <input
              {...register('state')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus-border-emerald-400 focus:outline-none"
            />
          </Field>
          <Field label="Postal code" error={errors.postalCode?.message}>
            <input
              {...register('postalCode')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <input
              {...register('country')}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              placeholder="NG"
            />
          </Field>
        </div>
        <Field label="Internal notes" error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
          />
        </Field>
      </FormSection>

      <FormSection title="Linked guardians" subtitle="Attach existing guardians">
        <div className="space-y-4">
          <button
            type="button"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
            onClick={() =>
              guardianArray.append({ guardianId: '', relationship: '', isPrimary: false, order: undefined })
            }
          >
            Add guardian
          </button>

          {guardianArray.fields.length === 0 ? (
            <p className="text-sm text-emerald-100/70">No guardians linked.</p>
          ) : (
            guardianArray.fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-xl border border-emerald-800/30 bg-emerald-900/40 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="text-emerald-200/70">Guardian {index + 1}</span>
                  <button
                    type="button"
                    className="font-semibold text-red-300 hover:text-red-200"
                    onClick={() => guardianArray.remove(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Guardian ID" error={errors.guardians?.[index]?.guardianId?.message}>
                    <input
                      {...register(`guardians.${index}.guardianId` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="Guardian UUID"
                    />
                  </Field>
                  <Field label="Relationship" error={errors.guardians?.[index]?.relationship?.message}>
                    <input
                      {...register(`guardians.${index}.relationship` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="Parent"
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-200/80">
                    <input
                      type="checkbox"
                      {...register(`guardians.${index}.isPrimary` as const)}
                      className="h-4 w-4 rounded border border-emerald-700/40 bg-emerald-900/60 text-emerald-500"
                    />
                    Primary guardian
                  </label>
                  <Field label="Contact order" error={errors.guardians?.[index]?.order?.message}>
                    <input
                      type="number"
                      {...register(`guardians.${index}.order` as const, { valueAsNumber: true })}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="0"
                      min={0}
                    />
                  </Field>
                </div>
              </div>
            ))
          )}
        </div>
      </FormSection>

      <FormSection title="Inline guardians" subtitle="Create guardian records immediately">
        <div className="space-y-4">
          <button
            type="button"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
            onClick={() =>
              inlineGuardianArray.append({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                alternatePhone: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                postalCode: '',
                country: '',
                notes: '',
                relationship: '',
                isPrimary: false,
                order: undefined,
              })
            }
          >
            Add inline guardian
          </button>

          {inlineGuardianArray.fields.length === 0 ? (
            <p className="text-sm text-emerald-100/70">No inline guardians yet.</p>
          ) : (
            inlineGuardianArray.fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-xl border border-emerald-800/30 bg-emerald-900/40 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span className="text-emerald-200/70">Guardian {index + 1}</span>
                  <button
                    type="button"
                    className="font-semibold text-red-300 hover:text-red-200"
                    onClick={() => inlineGuardianArray.remove(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="First name" error={errors.inlineGuardians?.[index]?.firstName?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.firstName` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="Last name" error={errors.inlineGuardians?.[index]?.lastName?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.lastName` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="Email" error={errors.inlineGuardians?.[index]?.email?.message}>
                    <input
                      type="email"
                      {...register(`inlineGuardians.${index}.email` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="guardian@olive.school"
                    />
                  </Field>
                  <Field label="Phone" error={errors.inlineGuardians?.[index]?.phone?.message}>
                    <input
                      type="tel"
                      {...register(`inlineGuardians.${index}.phone` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="0803 456 7890"
                    />
                  </Field>
                  <Field label="Alternate phone" error={errors.inlineGuardians?.[index]?.alternatePhone?.message}>
                    <input
                      type="tel"
                      {...register(`inlineGuardians.${index}.alternatePhone` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="Relationship" error={errors.inlineGuardians?.[index]?.relationship?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.relationship` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="Parent"
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-200/80">
                    <input
                      type="checkbox"
                      {...register(`inlineGuardians.${index}.isPrimary` as const)}
                      className="h-4 w-4 rounded border border-emerald-700/40 bg-emerald-900/60 text-emerald-500"
                    />
                    Primary guardian
                  </label>
                  <Field label="Order" error={errors.inlineGuardians?.[index]?.order?.message}>
                    <input
                      type="number"
                      {...register(`inlineGuardians.${index}.order` as const, { valueAsNumber: true })}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Address line 1" error={errors.inlineGuardians?.[index]?.addressLine1?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.addressLine1` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="Address line 2" error={errors.inlineGuardians?.[index]?.addressLine2?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.addressLine2` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="City" error={errors.inlineGuardians?.[index]?.city?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.city` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="State" error={errors.inlineGuardians?.[index]?.state?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.state` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="Postal code" error={errors.inlineGuardians?.[index]?.postalCode?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.postalCode` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                    />
                  </Field>
                  <Field label="Country" error={errors.inlineGuardians?.[index]?.country?.message}>
                    <input
                      {...register(`inlineGuardians.${index}.country` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="NG"
                    />
                  </Field>
                  <Field label="Notes" error={errors.inlineGuardians?.[index]?.notes?.message}>
                    <textarea
                      rows={2}
                      {...register(`inlineGuardians.${index}.notes` as const)}
                      className="w-full rounded-lg border border-emerald-700/40 bg-emerald-900/60 px-3 py-2 text-sm text-emerald-50"
                      placeholder="Additional notes"
                    />
                  </Field>
                </div>
              </div>
            ))
          )}
        </div>
      </FormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create student' : 'Update student'}
        </button>
      </div>
    </form>
  );
}

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <section className="rounded-2xl border border-emerald-800/40 bg-emerald-950/60 p-4">
      <header className="mb-4 space-y-1">
        <p className="text-xs uppercase tracking-wide text-emerald-200/70">{title}</p>
        {subtitle ? <p className="text-xs text-emerald-100/70">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-emerald-100/80">
      <span className="text-xs uppercase tracking-wide text-emerald-200/80">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
