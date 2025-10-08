'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';

/**
 * Lightweight option type used by {@link SearchSelect}. The optional `searchDocument`
 * allows callers to provide additional searchable text without affecting the
 * rendered label (for example, concatenate name and email strings).
 */
export type SearchSelectOption = {
  value: string;
  label: string;
  searchDocument?: string;
};

/**
 * Props for {@link SearchSelect}, a reusable select input with client-side
 * search filtering, loading/empty messaging and consistent Olive Tree styling.
 */
export interface SearchSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void;
  selectRef?: (instance: HTMLSelectElement | null) => void;
  options: SearchSelectOption[];
  placeholderOption?: string;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
  noMatchesMessage?: string;
  helperText?: string;
  errorText?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchSelect({
  id,
  label,
  value,
  onChange,
  onBlur,
  selectRef,
  options,
  placeholderOption = 'Select an option',
  searchPlaceholder = 'Search…',
  noOptionsMessage = 'No options available.',
  noMatchesMessage = 'No matches. Try adjusting your search.',
  helperText,
  errorText,
  className,
  disabled = false,
  loading = false,
}: SearchSelectProps): JSX.Element {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    if (!normalisedQuery) {
      return options;
    }

    return options.filter((option) => {
      const corpus = option.searchDocument ?? option.label;
      return corpus.toLowerCase().includes(normalisedQuery);
    });
  }, [options, query]);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const computedOptions = useMemo(() => {
    if (!selectedOption) {
      return filteredOptions;
    }

    const alreadyPresent = filteredOptions.some((option) => option.value === selectedOption.value);
    if (alreadyPresent) {
      return filteredOptions;
    }

    return [selectedOption, ...filteredOptions];
  }, [filteredOptions, selectedOption]);

  const showNoOptionsMessage = !loading && options.length === 0;
  const showNoMatchesMessage =
    !loading && options.length > 0 && filteredOptions.length === 0 && query.trim().length > 0;

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={className}>
      <label
        className="block text-xs font-semibold uppercase tracking-wide text-emerald-200/80"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={options.length === 0 ? noOptionsMessage : searchPlaceholder}
        disabled={disabled || options.length === 0}
        className="mt-2 w-full rounded-xl border border-emerald-700/40 bg-emerald-950/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <select
        id={id}
        ref={selectRef}
        value={value}
        onChange={handleSelectChange}
        onBlur={onBlur}
        disabled={disabled || options.length === 0}
        className="mt-2 w-full rounded-xl border border-emerald-700/50 bg-emerald-950/40 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholderOption}</option>
        {computedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {loading ? (
        <p className="mt-1 text-[11px] text-emerald-100/60">Loading options…</p>
      ) : null}
      {showNoOptionsMessage ? (
        <p className="mt-1 text-[11px] text-emerald-100/60">{noOptionsMessage}</p>
      ) : null}
      {showNoMatchesMessage ? (
        <p className="mt-1 text-[11px] text-emerald-100/60">{noMatchesMessage}</p>
      ) : null}
      {errorText ? <p className="mt-1 text-xs text-red-300">{errorText}</p> : null}
      {helperText && !errorText ? (
        <p className="mt-1 text-xs text-emerald-100/60">{helperText}</p>
      ) : null}
    </div>
  );
}
