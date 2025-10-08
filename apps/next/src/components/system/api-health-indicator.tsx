'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@olive/ui';
import { fetchJson, ApiError } from '../../lib/api/fetch-json';

type ApiHealthStatus = 'loading' | 'healthy' | 'degraded' | 'unhealthy';

type HealthResponse = {
  status?: string;
};

const POLL_INTERVAL_MS = 30_000;
const DEGRADED_THRESHOLD_MS = 1500;

function resolveLabel(status: ApiHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'API online';
    case 'degraded':
      return 'API degraded';
    case 'unhealthy':
      return 'API offline';
    default:
      return 'Checking API…';
  }
}

function resolveColourClasses(status: ApiHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]';
    case 'degraded':
      return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]';
    case 'unhealthy':
      return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.45)]';
    default:
      return 'bg-slate-500/80';
  }
}

export function ApiHealthIndicator(): JSX.Element {
  const [status, setStatus] = useState<ApiHealthStatus>('loading');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    const started = performance.now();

    try {
      const response = await fetchJson<HealthResponse>('/healthz', {
        includeCredentials: false,
      });

      const duration = performance.now() - started;
      const isOk = typeof response?.status === 'string' ? response.status.toLowerCase() === 'ok' : true;

      if (!isOk) {
        setStatus('degraded');
      } else if (duration > DEGRADED_THRESHOLD_MS) {
        setStatus('degraded');
      } else {
        setStatus('healthy');
      }
    } catch (error) {
      if (error instanceof ApiError && error.status >= 500) {
        setStatus('unhealthy');
      } else {
        setStatus('degraded');
      }
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const run = async () => {
      if (cancelled) return;
      await checkHealth();
      if (cancelled) return;
      timer = window.setTimeout(run, POLL_INTERVAL_MS);
    };

    run();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [checkHealth]);

  const label = useMemo(() => resolveLabel(status), [status]);

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-100/80"
      aria-live="polite"
      title={lastChecked ? `${label} • Checked ${lastChecked.toLocaleTimeString()}` : label}
    >
      <span
        className={cn('inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-300', resolveColourClasses(status))}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
