'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const branchFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  addressLine1: z.string().trim().max(120).optional().or(z.literal('')),
  addressLine2: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  postalCode: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  timezone: z.string().trim().max(100).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

export interface BranchFormProps {
  initialValues?: Partial<BranchFormValues>;
  onSubmit: (values: BranchFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  title?: string;
}

const emptyValues: BranchFormValues = {
  name: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  timezone: '',
  phone: '',
  email: '',
  notes: '',
};

export function BranchForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Save branch',
  title = 'Branch details',
}: BranchFormProps): JSX.Element {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    form.reset({
      ...emptyValues,
      ...initialValues,
    });
  }, [form, initialValues]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      addressLine1: values.addressLine1?.trim() || undefined,
      addressLine2: values.addressLine2?.trim() || undefined,
      city: values.city?.trim() || undefined,
      state: values.state?.trim() || undefined,
      postalCode: values.postalCode?.trim() || undefined,
      country: values.country?.trim() || undefined,
      timezone: values.timezone?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
  });

  return (
    <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-emerald-100/70">
        Capture branch location and contact information to support scheduling and communications.
      </p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="branch-name">
            Name
          </label>
          <input
            id="branch-name"
            type="text"
            {...form.register('name')}
            className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            placeholder="e.g. Main Campus"
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-red-300">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="address-line1">
              Address line 1
            </label>
            <input
              id="address-line1"
              type="text"
              {...form.register('addressLine1')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="address-line2">
              Address line 2
            </label>
            <input
              id="address-line2"
              type="text"
              {...form.register('addressLine2')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="Suite, building"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="city">
              City
            </label>
            <input
              id="city"
              type="text"
              {...form.register('city')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="state">
              State / Region
            </label>
            <input
              id="state"
              type="text"
              {...form.register('state')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="postal-code">
              Postal code
            </label>
            <input
              id="postal-code"
              type="text"
              {...form.register('postalCode')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              type="text"
              {...form.register('country')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="timezone">
              Timezone
            </label>
            <input
              id="timezone"
              type="text"
              {...form.register('timezone')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="e.g. Europe/London"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="text"
              {...form.register('phone')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...form.register('email')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-red-300">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...form.register('notes')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="Important branch notes, contacts, or reminders"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-emerald-600/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-800/40"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
