'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type StudentFiltersState = {
  search: string;
  includeArchived: boolean;
};

export interface StudentsFiltersProps {
  initialState?: Partial<StudentFiltersState>;
  onChange: (state: StudentFiltersState) => void;
}

const DEFAULT_STATE: StudentFiltersState = {
  search: '',
  includeArchived: false,
};

export function StudentsFilters({ initialState, onChange }: StudentsFiltersProps): JSX.Element {
  const [search, setSearch] = useState(initialState?.search ?? DEFAULT_STATE.search);
  const [includeArchived, setIncludeArchived] = useState(
    initialState?.includeArchived ?? DEFAULT_STATE.includeArchived,
  );

  const state = useMemo<StudentFiltersState>(
    () => ({
      search,
      includeArchived,
    }),
    [search, includeArchived],
  );

  useEffect(() => {
    onChange(state);
  }, [state, onChange]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const handleToggleArchived = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeArchived(event.target.checked);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-4 text-sm text-emerald-100 md:flex-row md:items-end md:justify-between">
      <div className="flex-1">
        <label className="flex flex-col gap-2" htmlFor="students-search">
          <span className="text-xs uppercase tracking-wide text-emerald-200/80">Search</span>
          <input
            id="students-search"
            type="search"
            placeholder="Search by name, student number, email, or guardian"
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-emerald-700/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-200/80">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-emerald-700/40 bg-emerald-900/60 text-emerald-500 focus:ring-emerald-400"
          checked={includeArchived}
          onChange={handleToggleArchived}
        />
        Include archived
      </label>
    </div>
  );
}
