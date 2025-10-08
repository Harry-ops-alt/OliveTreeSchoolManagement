'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Classroom } from '../../lib/types/branches';
import type {
  ClassScheduleClashDetails,
  CreateClassScheduleInput,
  TeacherProfileSummary,
} from '../../lib/types/class-schedules';
import { SearchSelect, type SearchSelectOption } from '../ui/search-select';

const DAY_OPTIONS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

const timePattern = /^([0-1]?\d|2[0-3]):[0-5]\d$/;

const scheduleFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  dayOfWeek: z.enum(DAY_OPTIONS),
  startTime: z
    .string()
    .regex(timePattern, 'Provide start time in HH:MM format'),
  endTime: z
    .string()
    .regex(timePattern, 'Provide end time in HH:MM format'),
  classroomId: z.string().uuid().optional().or(z.literal('')),
  teacherProfileId: z.string().uuid().optional().or(z.literal('')),
});

export type ClassScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ClassScheduleFormProps {
  classrooms: Classroom[];
  teacherProfiles: TeacherProfileSummary[];
  teacherProfilesLoading?: boolean;
  initialValues?: Partial<ClassScheduleFormValues>;
  isSubmitting?: boolean;
  onSubmit: (payload: CreateClassScheduleInput) => Promise<void> | void;
  onCancel: () => void;
  conflictDetails?: ClassScheduleClashDetails | null;
  conflictMessage?: string | null;
}

const emptyValues: ClassScheduleFormValues = {
  title: '',
  description: '',
  dayOfWeek: 'MONDAY',
  startTime: '09:00',
  endTime: '10:00',
  classroomId: '',
  teacherProfileId: '',
};

function normaliseTime(value: string): string {
  return value ? value.trim() : '';
}

function toIsoTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function ClassScheduleForm({
  classrooms,
  teacherProfiles,
  teacherProfilesLoading = false,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
  conflictDetails,
  conflictMessage,
}: ClassScheduleFormProps): JSX.Element {
  const form = useForm<ClassScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: emptyValues,
  });
  const teacherOptions: SearchSelectOption[] = useMemo(
    () =>
      teacherProfiles.map((profile) => {
        const displayName = profile.user
          ? `${profile.user.firstName ?? ''} ${profile.user.lastName ?? ''}`.trim() || profile.user.email || 'Unnamed teacher'
          : 'Unnamed teacher';

        const searchDocument = profile.user
          ? [profile.user.firstName, profile.user.lastName, profile.user.email]
              .filter((value): value is string => Boolean(value))
              .join(' ')
          : displayName;

        return {
          value: profile.id,
          label: displayName,
          searchDocument,
        } satisfies SearchSelectOption;
      }),
    [teacherProfiles],
  );

  useEffect(() => {
    form.reset({
      ...emptyValues,
      ...initialValues,
      startTime: normaliseTime(initialValues?.startTime ?? emptyValues.startTime),
      endTime: normaliseTime(initialValues?.endTime ?? emptyValues.endTime),
      classroomId: initialValues?.classroomId ?? emptyValues.classroomId,
      teacherProfileId: initialValues?.teacherProfileId ?? emptyValues.teacherProfileId,
    });
  }, [form, initialValues]);

  useEffect(() => {
    if (conflictDetails) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [conflictDetails]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CreateClassScheduleInput = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      dayOfWeek: values.dayOfWeek,
      startTime: toIsoTime(values.startTime),
      endTime: toIsoTime(values.endTime),
      classroomId: values.classroomId || undefined,
      teacherProfileId: values.teacherProfileId || undefined,
    };

    await onSubmit(payload);
  });

  return (
    <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-6">
      <h3 className="text-lg font-semibold text-white">Schedule class</h3>

      {conflictMessage ? (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100/80">
          {conflictMessage}
        </div>
      ) : null}

      {conflictDetails ? <ConflictDetails details={conflictDetails} /> : null}

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="schedule-title">
            Title
          </label>
          <input
            id="schedule-title"
            type="text"
            {...form.register('title')}
            className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            placeholder="e.g. Grade 6 Mathematics"
          />
          {form.formState.errors.title ? (
            <p className="text-xs text-red-300">{form.formState.errors.title.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="schedule-description">
            Description
          </label>
          <textarea
            id="schedule-description"
            rows={3}
            {...form.register('description')}
            className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            placeholder="Optional notes, subjects, or focus areas"
          />
          {form.formState.errors.description ? (
            <p className="text-xs text-red-300">{form.formState.errors.description.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="schedule-day">
              Day of week
            </label>
            <select
              id="schedule-day"
              {...form.register('dayOfWeek')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0) + option.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {form.formState.errors.dayOfWeek ? (
              <p className="text-xs text-red-300">{form.formState.errors.dayOfWeek.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="schedule-start">
              Start time
            </label>
            <input
              id="schedule-start"
              type="time"
              {...form.register('startTime')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
            {form.formState.errors.startTime ? (
              <p className="text-xs text-red-300">{form.formState.errors.startTime.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="schedule-end">
              End time
            </label>
            <input
              id="schedule-end"
              type="time"
              {...form.register('endTime')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            />
            {form.formState.errors.endTime ? (
              <p className="text-xs text-red-300">{form.formState.errors.endTime.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80" htmlFor="schedule-classroom">
              Classroom
            </label>
            <select
              id="schedule-classroom"
              {...form.register('classroomId')}
              className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="">Unassigned</option>
              {classrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {form.formState.errors.classroomId ? (
              <p className="text-xs text-red-300">{form.formState.errors.classroomId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <SearchSelect
              id="schedule-teacher"
              label="Lead teacher"
              value={form.watch('teacherProfileId') ?? ''}
              onChange={(nextValue) => form.setValue('teacherProfileId', nextValue, { shouldDirty: true, shouldTouch: true })}
              onBlur={() => void form.trigger('teacherProfileId')}
              options={teacherOptions}
              placeholderOption="Unassigned"
              searchPlaceholder="Search by name or email"
              noOptionsMessage="No teacher profiles available for this branch."
              noMatchesMessage="No matches. Try adjusting your search."
              errorText={form.formState.errors.teacherProfileId?.message}
              disabled={teacherProfilesLoading || teacherOptions.length === 0}
              loading={teacherProfilesLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-emerald-600/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-800/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Scheduling…' : 'Save schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ConflictDetailsProps {
  details: ClassScheduleClashDetails;
}

function ConflictDetails({ details }: ConflictDetailsProps): JSX.Element {
  const hasClassroom = details.classroom.length > 0;
  const hasTeachers = details.teacherProfiles.length > 0;
  const hasStaff = details.staffAssignments.length > 0;

  if (!hasClassroom && !hasTeachers && !hasStaff) {
    return (
      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/70">
        Clash detected, but no additional details were provided.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      {hasClassroom ? (
        <div>
          <h4 className="text-sm font-semibold text-amber-100">Classroom conflicts</h4>
          <ul className="mt-2 space-y-1 text-xs text-amber-100/80">
            {details.classroom.map((schedule) => (
              <li key={schedule.id}>
                {schedule.title} — {schedule.dayOfWeek.slice(0, 1)}{schedule.dayOfWeek.slice(1).toLowerCase()} {new Date(schedule.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' '}
                –
                {' '}
                {new Date(schedule.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasTeachers ? (
        <div>
          <h4 className="text-sm font-semibold text-amber-100">Lead teacher conflicts</h4>
          <ul className="mt-2 space-y-1 text-xs text-amber-100/80">
            {details.teacherProfiles.map((schedule) => (
              <li key={schedule.id}>
                {schedule.title} — {schedule.dayOfWeek.slice(0, 1)}{schedule.dayOfWeek.slice(1).toLowerCase()} {new Date(schedule.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' '}
                –
                {' '}
                {new Date(schedule.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasStaff ? (
        <div>
          <h4 className="text-sm font-semibold text-amber-100">Support staff conflicts</h4>
          <ul className="mt-2 space-y-2 text-xs text-amber-100/80">
            {details.staffAssignments.map((clash) => (
              <li key={clash.schedule.id}>
                <div>
                  {clash.schedule.title} — {clash.schedule.dayOfWeek.slice(0, 1)}{clash.schedule.dayOfWeek.slice(1).toLowerCase()} {new Date(clash.schedule.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' '}
                  –
                  {' '}
                  {new Date(clash.schedule.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-amber-100/60">
                  Conflicting staff IDs: {clash.userIds.join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
