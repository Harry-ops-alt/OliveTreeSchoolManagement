'use client';

import { useMemo } from 'react';
import type { StudentWithRelations } from '../../lib/api/students';
import { StatusPill } from '../status-pill';

export interface StudentsTableProps {
  students: StudentWithRelations[];
  onView: (student: StudentWithRelations) => void;
  onEdit: (student: StudentWithRelations) => void;
  onDelete: (student: StudentWithRelations) => void;
  deleting?: Record<string, boolean>;
}

function formatName(student: StudentWithRelations): string {
  const first = student.user?.firstName ?? '';
  const last = student.user?.lastName ?? '';
  const combined = `${first} ${last}`.trim();
  return combined || 'Unnamed';
}

function formatGrade(student: StudentWithRelations): string {
  return student.gradeLevel?.trim() || '—';
}

function formatCampus(student: StudentWithRelations): string {
  return student.branch?.name || '—';
}

export function StudentsTable({ students, onView, onEdit, onDelete, deleting = {} }: StudentsTableProps): JSX.Element {
  const hasStudents = students.length > 0;

  const rows = useMemo(
    () =>
      students.map((student) => ({
        key: student.id,
        name: formatName(student),
        grade: formatGrade(student),
        campus: formatCampus(student),
        guardiansCount: student.guardians?.length ?? 0,
        status: student.status ?? 'UNKNOWN',
        raw: student,
      })),
    [students],
  );

  if (!hasStudents) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/50 p-10 text-center text-sm text-emerald-100/70">
        No students match your filters. Adjust the criteria or add a new student.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-700/40">
      <table className="min-w-full divide-y divide-emerald-800/40 bg-emerald-950/70 text-sm text-emerald-100">
        <thead className="bg-emerald-900/60 text-xs uppercase tracking-wide text-emerald-200/80">
          <tr>
            <th scope="col" className="px-4 py-3 text-left">Name</th>
            <th scope="col" className="px-4 py-3 text-left">Grade/Year</th>
            <th scope="col" className="px-4 py-3 text-left">Campus</th>
            <th scope="col" className="px-4 py-3 text-left">Guardians</th>
            <th scope="col" className="px-4 py-3 text-left">Status</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-800/40">
          {rows.map((row) => (
            <tr key={row.key} className="transition hover:bg-emerald-900/40">
              <td className="px-4 py-3 font-medium text-white">{row.name}</td>
              <td className="px-4 py-3">{row.grade}</td>
              <td className="px-4 py-3">{row.campus}</td>
              <td className="px-4 py-3">{row.guardiansCount}</td>
              <td className="px-4 py-3">
                <StatusPill value={row.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-wide">
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-500/40 bg-emerald-800/30 px-3 py-1.5 text-emerald-100 transition hover:bg-emerald-700/40 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onView(row.raw)}
                    disabled={Boolean(deleting[row.key])}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onEdit(row.raw)}
                    disabled={Boolean(deleting[row.key])}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onDelete(row.raw)}
                    disabled={Boolean(deleting[row.key])}
                  >
                    {deleting[row.key] ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
