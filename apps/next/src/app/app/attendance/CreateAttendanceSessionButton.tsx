'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { createAttendanceSession } from '../../../lib/api/attendance';
import { listBranches } from '../../../lib/api/branches';
import { listClassSchedules } from '../../../lib/api/class-schedules';
import type { Branch } from '../../../lib/types/branches';
import type { ClassSchedule } from '../../../lib/types/class-schedules';
import { useToastHelpers } from '../../../components/toast/toast-provider';

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const defaultDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.toISOString().slice(0, 16);
};

export function CreateAttendanceSessionButton(): JSX.Element {
  const router = useRouter();
  const toast = useToastHelpers();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const [branchId, setBranchId] = useState('');
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [classSchedulesLoading, setClassSchedulesLoading] = useState(false);

  const [dateTime, setDateTime] = useState(defaultDateTimeLocal());
  const [classScheduleId, setClassScheduleId] = useState('');
  const [notes, setNotes] = useState('');

  const hasBranches = branches.length > 0;

  const selectedBranchName = useMemo(() => {
    return branches.find((branch) => branch.id === branchId)?.name ?? '';
  }, [branches, branchId]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setIsSubmitting(false);
    setDateTime(defaultDateTimeLocal());
    setClassScheduleId('');
    setNotes('');
  }, []);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    setBranchError(null);
    try {
      const data = await listBranches();
      setBranches(data);
      setBranchId((current) => current || data[0]?.id || '');
    } catch (error) {
      console.error('Failed to load branches', error);
      setBranchError('Unable to load branches. Please try again.');
      toast.error('Unable to load branch options.');
    } finally {
      setBranchesLoading(false);
    }
  }, [toast]);

  const loadClassSchedules = useCallback(async (branch: string) => {
    if (!branch) {
      setClassSchedules([]);
      return;
    }
    setClassSchedulesLoading(true);
    try {
      const data = await listClassSchedules(branch);
      setClassSchedules(data);
      setClassScheduleId((current) => {
        if (current && data.some((schedule) => schedule.id === current)) {
          return current;
        }
        return '';
      });
    } catch (error) {
      console.error('Failed to load class schedules', error);
      toast.error('Unable to load class schedules for the selected branch.');
      setClassSchedules([]);
    } finally {
      setClassSchedulesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (branches.length === 0 && !branchesLoading) {
      void loadBranches();
    }
  }, [isOpen, branches.length, branchesLoading, loadBranches]);

  useEffect(() => {
    if (!isOpen || !branchId) {
      return;
    }

    void loadClassSchedules(branchId);
  }, [isOpen, branchId, loadClassSchedules]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!branchId) {
        toast.error('Please select a branch.');
        return;
      }

      if (!dateTime) {
        toast.error('Please choose a date and time for the session.');
        return;
      }

      const parsedDate = new Date(dateTime);
      if (Number.isNaN(parsedDate.getTime())) {
        toast.error('The provided date is invalid.');
        return;
      }

      setIsSubmitting(true);

      try {
        await createAttendanceSession({
          branchId,
          date: parsedDate.toISOString(),
          classScheduleId: classScheduleId || undefined,
          notes: notes.trim() || undefined,
        });

        toast.success('Attendance session created.', `Session for ${selectedBranchName || 'branch'} scheduled`);
        closeModal();
        router.refresh();
      } catch (error) {
        console.error('Failed to create attendance session', error);
        toast.error('Unable to create attendance session. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [branchId, classScheduleId, closeModal, dateTime, notes, router, selectedBranchName, toast],
  );

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Create session
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur" role="dialog" aria-modal>
          <div
            className="w-full max-w-xl rounded-3xl border border-emerald-500/30 bg-emerald-950/95 p-6 text-emerald-50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white">New attendance session</h2>
                <p className="text-sm text-emerald-100/70">
                  Schedule an ad-hoc register for a branch and optionally link it to a class timetable entry.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-emerald-500/40 p-1 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Branch</label>
                <div className="relative">
                  <select
                    className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                    value={branchId}
                    onChange={(event) => {
                      setBranchId(event.target.value);
                      setClassScheduleId('');
                    }}
                    disabled={branchesLoading || isSubmitting}
                    required
                  >
                    {!hasBranches ? <option value="">{branchError ?? 'No branches available'}</option> : null}
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {branchesLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-200" aria-hidden />
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Session date & time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                  value={dateTime}
                  onChange={(event) => setDateTime(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Link existing class (optional)</label>
                <div className="relative">
                  <select
                    className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                    value={classScheduleId}
                    onChange={(event) => setClassScheduleId(event.target.value)}
                    disabled={classSchedulesLoading || isSubmitting || !hasBranches}
                  >
                    <option value="">No linked class</option>
                    {classSchedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {`${schedule.title} · ${timeFormatter.format(new Date(schedule.startTime))}`}
                      </option>
                    ))}
                  </select>
                  {classSchedulesLoading ? (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-200" aria-hidden />
                  ) : null}
                </div>
                {hasBranches && classSchedules.length === 0 && !classSchedulesLoading ? (
                  <p className="text-xs text-emerald-100/60">No recurring classes found for {selectedBranchName || 'this branch'}.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Notes</label>
                <textarea
                  className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional context for this session"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-200 hover:text-white disabled:opacity-60"
                  disabled={isSubmitting || !hasBranches}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}<span>Create session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
