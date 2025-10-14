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
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Create session
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal>
          <div
            className="w-full max-w-xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New attendance session</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schedule an ad-hoc register for a branch and optionally link it to a class timetable entry.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" aria-hidden />
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Session date & time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={dateTime}
                  onChange={(event) => setDateTime(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Link existing class (optional)</label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" aria-hidden />
                  ) : null}
                </div>
                {hasBranches && classSchedules.length === 0 && !classSchedulesLoading ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No recurring classes found for {selectedBranchName || 'this branch'}.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
