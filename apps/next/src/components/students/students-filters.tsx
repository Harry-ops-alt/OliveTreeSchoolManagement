'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

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
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <Label htmlFor="students-search" className="text-sm font-medium">
              Search
            </Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="students-search"
                type="search"
                placeholder="Search by name, student number, email, or guardian"
                value={search}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-archived"
              checked={includeArchived}
              onChange={handleToggleArchived}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Label
              htmlFor="include-archived"
              className="text-sm font-medium leading-none"
            >
              Include archived
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
