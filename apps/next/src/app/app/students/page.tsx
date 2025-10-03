'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  ApiError,
  deleteStudent,
  listStudents,
  type StudentListMeta,
  type StudentWithRelations,
} from '../../../lib/api/students';
import { StudentsTable } from '../../../components/students/students-table';
import { StudentsFilters, type StudentFiltersState } from '../../../components/students/students-filters';
import { useToastHelpers } from '../../../components/toast/toast-provider';

const PAGE_SIZE = 10;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function StudentsTableSkeleton(): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-700/40">
      <div className="h-12 bg-emerald-900/60" />
      <ul className="divide-y divide-emerald-800/40 bg-emerald-950/60">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="flex items-center gap-6 px-4 py-4">
            <div className="h-4 w-40 animate-pulse rounded bg-emerald-800/40" />
            <div className="h-4 w-24 animate-pulse rounded bg-emerald-800/40" />
            <div className="h-4 w-28 animate-pulse rounded bg-emerald-800/30" />
            <div className="h-4 w-16 animate-pulse rounded bg-emerald-800/30" />
            <div className="ms-auto flex gap-2">
              <div className="h-8 w-16 animate-pulse rounded bg-emerald-800/40" />
              <div className="h-8 w-16 animate-pulse rounded bg-emerald-800/30" />
              <div className="h-8 w-16 animate-pulse rounded bg-emerald-800/20" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaginationControls({
  meta,
  onChange,
}: {
  meta: StudentListMeta | null;
  onChange: (page: number) => void;
}): JSX.Element | null {
  if (!meta || meta.totalPages <= 1) {
    return null;
  }

  const canPrevious = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/60 px-4 py-3 text-xs uppercase tracking-wide text-emerald-200/80 md:flex-row">
      <span>
        Page {meta.page} of {meta.totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg border border-emerald-500/40 bg-emerald-900/40 px-4 py-2 text-emerald-100 transition hover:bg-emerald-800/40 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onChange(meta.page - 1)}
          disabled={!canPrevious}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onChange(meta.page + 1)}
          disabled={!canNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function StudentsPage(): JSX.Element {
  const router = useRouter();
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();

  const [filters, setFilters] = useState<StudentFiltersState>({ search: '', includeArchived: false });
  const [students, setStudents] = useState<StudentWithRelations[]>([]);
  const [meta, setMeta] = useState<StudentListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const refreshStudents = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setLoadError(null);

      try {
        const response = await listStudents({
          search: debouncedSearch || undefined,
          includeArchived: filters.includeArchived,
          page,
          pageSize: PAGE_SIZE,
        });

        const targetPage = Math.max(response.meta.totalPages || 1, 1);

        if (page > targetPage) {
          setPage(targetPage);
          return;
        }

        setStudents(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error('Failed to load students', error);
        if (error instanceof ApiError && error.status === 404) {
          setStudents([]);
          setMeta({ total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 1 });
          return;
        }

        setLoadError('Unable to load students right now. Please try again shortly.');
        showErrorToast('Unable to load student directory.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, filters.includeArchived, page, showErrorToast],
  );

  useEffect(() => {
    void refreshStudents();
  }, [refreshStudents]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.includeArchived]);

  useEffect(() => {
    void refreshStudents({ silent: true });
  }, [page, refreshStudents]);

  const handleFiltersChange = useCallback((state: StudentFiltersState) => {
    setFilters(state);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage((current) => (current === nextPage ? current : Math.max(nextPage, 1)));
  }, []);

  const handleView = useCallback(
    (student: StudentWithRelations) => {
      router.push(`/app/students/${student.id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (student: StudentWithRelations) => {
      router.push(`/app/students/${student.id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (student: StudentWithRelations) => {
      const fullName = `${student.user?.firstName ?? ''} ${student.user?.lastName ?? ''}`.trim() ||
        'this student';

      const confirmed = window.confirm(`Archive ${fullName}? They will remain accessible via audit logs.`);
      if (!confirmed) {
        return;
      }

      setDeleting((current) => ({ ...current, [student.id]: true }));

      try {
        await deleteStudent(student.id);
        showSuccessToast(`${fullName} has been archived.`, 'Student archived');
        await refreshStudents({ silent: true });
      } catch (error) {
        console.error('Failed to archive student', error);

        if (error instanceof ApiError && error.status === 404) {
          showErrorToast('Student already archived or not found.');
          await refreshStudents({ silent: true });
        } else {
          showErrorToast('Unable to archive student. Please try again.');
        }
      } finally {
        setDeleting((current) => {
          const { [student.id]: _removed, ...rest } = current;
          return rest;
        });
      }
    },
    [refreshStudents, showErrorToast, showSuccessToast],
  );

  const summary = useMemo(() => {
    if (!meta || meta.total === 0) {
      return null;
    }

    const start = (meta.page - 1) * meta.pageSize + 1;
    const end = start + students.length - 1;
    return `Showing ${start}-${end} of ${meta.total}`;
  }, [meta, students]);

  return (
    <div className="min-h-screen bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-emerald-300/80">Students</p>
            <h1 className="text-3xl font-semibold text-white">Student directory</h1>
            <p className="text-sm text-emerald-100/70">
              Browse and manage enrolled students, review guardian information, and archive profiles when
              needed.
            </p>
          </div>
          <Link
            href="/app/students/new"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create student
          </Link>
        </header>

        <StudentsFilters onChange={handleFiltersChange} />

        {summary ? (
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/60 px-4 py-2 text-xs uppercase tracking-wide text-emerald-200/80">
            {summary}
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 text-sm text-emerald-100/70">
            {loadError}
            <button
              type="button"
              className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-800/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-700/40"
              onClick={() => refreshStudents()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <StudentsTableSkeleton />
        ) : (
          <StudentsTable
            students={students}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}

        <PaginationControls meta={meta} onChange={handlePageChange} />
      </div>
    </div>
  );
}
