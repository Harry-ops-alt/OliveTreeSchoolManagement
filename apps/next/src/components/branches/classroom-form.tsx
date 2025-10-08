'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const classroomFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  capacity: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length ? Number(value) : undefined))
    .pipe(
      z
        .number({ invalid_type_error: 'Capacity must be a number' })
        .int('Capacity must be an integer')
        .min(1, 'Capacity must be at least 1')
        .max(1000, 'Capacity must be less than or equal to 1000')
        .optional(),
    ),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type ClassroomFormValues = z.infer<typeof classroomFormSchema>;

export interface ClassroomFormProps {
  initialValues?: Partial<ClassroomFormValues>;
  onSubmit: (values: ClassroomFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  title?: string;
}

const emptyClassroomValues: ClassroomFormValues = {
  name: '',
  capacity: undefined,
  location: '',
  notes: '',
};

export function ClassroomForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Save room',
  title = 'Classroom details',
}: ClassroomFormProps): JSX.Element {
  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(classroomFormSchema),
    defaultValues: emptyClassroomValues,
  });

  useEffect(() => {
    form.reset({
      ...emptyClassroomValues,
      ...initialValues,
    });
  }, [form, initialValues]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      location: values.location?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
  });

  return (
    <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="classroom-name">
            Name
          </label>
          <input
            id="classroom-name"
            type="text"
            {...form.register('name')}
            className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            placeholder="e.g. Room 101 or Science Lab"
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-red-300">{form.formState.errors.name.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="capacity">
              Capacity
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              max={1000}
              {...form.register('capacity')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="e.g. 24"
            />
            {form.formState.errors.capacity ? (
              <p className="text-xs text-red-300">{form.formState.errors.capacity.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              type="text"
              {...form.register('location')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="Building or floor"
            />
          </div>
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
            placeholder="Equipment availability, accessibility notes, etc."
          />
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
