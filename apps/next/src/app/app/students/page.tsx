'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
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
import { PageHeader } from '../../../components/ui/page-header';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

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
    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-lg">
          <div className="h-12 bg-muted/30" />
          <ul className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, index) => (
              <li key={index} className="flex items-center gap-6 px-6 py-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
                <div className="ms-auto flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
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
    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardContent className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Page {meta.page} of {meta.totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(meta.page - 1)}
            disabled={!canPrevious}
          >
            Previous
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onChange(meta.page + 1)}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="Browse and manage enrolled students, review guardian information, and archive profiles when needed."
        action={
          <Link href="/app/students/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Student
            </Button>
          </Link>
        }
      />

      <StudentsFilters onChange={handleFiltersChange} />

      {summary ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{summary}</p>
          </CardContent>
        </Card>
      ) : null}

      {loadError ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-6">
            <p className="text-sm text-gray-900 dark:text-white">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refreshStudents()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
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
  );
}
