'use client';

import { useSearchParams } from 'next/navigation';

export function LoginError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (!error) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
      {error}
    </div>
  );
}
