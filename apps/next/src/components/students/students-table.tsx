'use client';

import { useMemo } from 'react';
import type { StudentWithRelations } from '../../lib/api/students';
import { StatusPill } from '../status-pill';
import { Card, CardContent } from '../ui/card';
import { cn } from '@olive/ui';

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
      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-10 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No students match your filters. Adjust the criteria or add a new student.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Grade/Year</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Campus</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Guardians</th>
                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr 
                  key={row.key} 
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 transition-all duration-200",
                    index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30",
                    "hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:shadow-sm"
                  )}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{row.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.grade}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.campus}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{row.guardiansCount}</td>
                  <td className="px-6 py-4">
                    <StatusPill value={row.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:bg-gray-50 hover:shadow dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => onView(row.raw)}
                        disabled={Boolean(deleting[row.key])}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 shadow-sm transition-all hover:bg-blue-100 hover:shadow dark:hover:bg-blue-900/30 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => onEdit(row.raw)}
                        disabled={Boolean(deleting[row.key])}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 shadow-sm transition-all hover:bg-red-100 hover:shadow dark:hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-50"
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
      </CardContent>
    </Card>
  );
}
