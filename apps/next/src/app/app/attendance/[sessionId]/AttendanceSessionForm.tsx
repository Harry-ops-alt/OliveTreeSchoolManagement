'use client';

import { useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { AttendanceSessionDetail } from '../types';
import { ATTENDANCE_STATUSES } from '../types';
import {
  getInitialAttendanceFormState,
  updateAttendanceSessionAction,
} from './actions';

interface AttendanceSessionFormProps {
  session: AttendanceSessionDetail;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:opacity-60"
      disabled={pending}
      data-testid="attendance-form-submit"
    >
      {pending ? 'Saving…' : 'Save updates'}
    </button>
  );
}

export function AttendanceSessionForm({ session }: AttendanceSessionFormProps) {
  const initialState = useMemo(() => getInitialAttendanceFormState(), []);
  const [state, formAction] = useFormState(updateAttendanceSessionAction, initialState);

  return (
    <form action={formAction} className="space-y-6" data-testid="attendance-form">
      <input type="hidden" name="sessionId" value={session.id} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 text-sm text-emerald-100/70">
          <label className="flex items-center gap-2 font-medium text-emerald-50">
            <input
              type="checkbox"
              name="finalize"
              defaultChecked={Boolean(session.finalizedAt)}
              className="h-4 w-4 rounded border border-emerald-500/40 bg-transparent text-emerald-400 focus:ring-emerald-400"
            />
            Finalise session after saving
          </label>
          <p>When finalised, the register is locked for further edits.</p>
        </div>
        <SubmitButton />
      </div>

      {state.error ? (
        <div
          className="rounded-lg border border-red-500/40 bg-red-900/30 p-3 text-sm text-red-100"
          data-testid="attendance-form-error"
        >
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div
          className="rounded-lg border border-emerald-500/50 bg-emerald-900/40 p-3 text-sm text-emerald-100"
          data-testid="attendance-form-success"
        >
          Attendance session updated successfully.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-900/60">
        <table className="min-w-full divide-y divide-emerald-500/20 text-sm">
          <thead className="bg-emerald-900/70 text-emerald-200/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Student</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Notes</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide">Recorded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/20 text-emerald-100/80">
            {session.records.map((record) => (
              <tr key={record.studentId} data-testid="attendance-form-row">
                <td className="px-4 py-3 font-medium text-white">{record.studentName}</td>
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${record.studentEmail}`}
                    className="text-emerald-200 underline hover:text-emerald-100"
                  >
                    {record.studentEmail}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <select
                    name={`status-${record.studentId}`}
                    defaultValue={record.status}
                    className="w-full rounded-lg border border-emerald-500/40 bg-emerald-900/80 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                    data-testid="attendance-status-select"
                  >
                    {ATTENDANCE_STATUSES.map((status) => (
                      <option key={status} value={status} className="bg-emerald-900">
                        {status.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <textarea
                    name={`notes-${record.studentId}`}
                    defaultValue={record.notes ?? ''}
                    rows={2}
                    className="w-full rounded-lg border border-emerald-500/40 bg-emerald-900/80 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                    placeholder="Add notes"
                    data-testid="attendance-notes-textarea"
                  />
                </td>
                <td className="px-4 py-3 text-emerald-100/70">
                  {record.recordedAt
                    ? new Date(record.recordedAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Not yet recorded'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
