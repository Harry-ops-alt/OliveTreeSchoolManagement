'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { cn } from '@olive/ui';

export type ToastVariant = 'default' | 'success' | 'error';

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
};

type ToastInstance = Required<Pick<ToastOptions, 'id'>> &
  Omit<ToastOptions, 'id'> & {
    id: string;
    variant: ToastVariant;
    duration: number;
  };

type ToastContextValue = {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}

function resolveIcon(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5" aria-hidden />;
    case 'error':
      return <CircleAlert className="h-5 w-5" aria-hidden />;
    default:
      return <Info className="h-5 w-5" aria-hidden />;
  }
}

function resolveVariantClasses(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return 'border-emerald-500/50 bg-emerald-900/90 text-emerald-100';
    case 'error':
      return 'border-red-500/50 bg-red-900/90 text-red-100';
    default:
      return 'border-slate-500/40 bg-slate-900/90 text-slate-100';
  }
}

export function ToastProvider({ children }: PropsWithChildren): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);

    return () => {
      Object.values(timersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
      timersRef.current = {};
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({ id, duration = 4000, variant = 'default', ...rest }: ToastOptions): string => {
      const toastId = id ?? generateId();

      setToasts((current) => {
        const next = current.filter((toast) => toast.id !== toastId);
        return [...next, { id: toastId, duration, variant, ...rest }];
      });

      if (timersRef.current[toastId]) {
        window.clearTimeout(timersRef.current[toastId]);
      }

      timersRef.current[toastId] = window.setTimeout(() => {
        dismissToast(toastId);
      }, duration);

      return toastId;
    },
    [dismissToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {mounted
        ? createPortal(
            <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-80 flex-col gap-3">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  role="status"
                  className={cn(
                    'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur',
                    resolveVariantClasses(toast.variant),
                  )}
                >
                  <span className="mt-0.5 text-emerald-100/80">{resolveIcon(toast.variant)}</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {toast.title?.trim() || (toast.variant === 'error' ? 'Something went wrong' : 'Notice')}
                    </p>
                    {toast.description?.trim() ? (
                      <p className="text-xs text-emerald-100/80">{toast.description.trim()}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-wide text-emerald-100/70 transition hover:text-white"
                    onClick={() => dismissToast(toast.id)}
                  >
                    Close
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export function useToastHelpers() {
  const { showToast, dismissToast } = useToast();

  const success = useCallback(
    (description: string, title = 'Success') =>
      showToast({ title, description, variant: 'success' }),
    [showToast],
  );

  const error = useCallback(
    (description: string, title = 'Something went wrong') =>
      showToast({ title, description, variant: 'error' }),
    [showToast],
  );

  const info = useCallback(
    (description: string, title = 'Notice') =>
      showToast({ title, description, variant: 'default' }),
    [showToast],
  );

  return {
    showToast,
    dismissToast,
    success,
    error,
    info,
  };
}
