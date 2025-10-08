'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  createAdmissionApplication,
  updateAdmissionApplication,
  type CreateApplicationPayload,
  type UpdateApplicationPayload,
} from '../../lib/api/admissions';
import type { AdmissionApplication } from '../../lib/types/admissions';
import { useToastHelpers } from '../toast/toast-provider';

const DATE_INPUT_LENGTH = 10;

type ApplicationDrawerProps = {
  leadId: string;
  open: boolean;
  application: AdmissionApplication | null;
  onClose: () => void;
  onApplicationChange: (application: AdmissionApplication) => void;
};

type FormState = {
  yearGroup: string;
  requestedStart: string;
  programmeChoice: string;
  schedulePreferences: string;
  additionalNotes: string;
};

const DEFAULT_STATE: FormState = {
  yearGroup: '',
  requestedStart: '',
  programmeChoice: '',
  schedulePreferences: '',
  additionalNotes: '',
};

const formatDateInput = (value: string | null): string => {
  if (!value) {
    return '';
  }
  try {
    return new Date(value).toISOString().slice(0, DATE_INPUT_LENGTH);
  } catch (error) {
    return '';
  }
};

export function ApplicationDrawer({
  leadId,
  open,
  application,
  onClose,
  onApplicationChange,
}: ApplicationDrawerProps): JSX.Element | null {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [currentApplication, setCurrentApplication] = useState<AdmissionApplication | null>(application);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveStep(0);
    setCurrentApplication(application);

    if (application) {
      const extra = application.extraData ?? {};
      setForm({
        yearGroup: application.yearGroup ?? '',
        requestedStart: formatDateInput(application.requestedStart),
        programmeChoice: typeof extra.programmeChoice === 'string' ? extra.programmeChoice : '',
        schedulePreferences: typeof extra.schedulePreferences === 'string' ? extra.schedulePreferences : '',
        additionalNotes: typeof extra.additionalNotes === 'string' ? extra.additionalNotes : '',
      });
      return;
    }

    setForm(DEFAULT_STATE);
  }, [application, open]);

  const portalTarget = typeof window !== 'undefined' ? document.body : null;

  const handleCreateDraft = useCallback(async () => {
    if (currentApplication) {
      return currentApplication;
    }

    try {
      const payload: CreateApplicationPayload = {
        leadId,
        status: 'DRAFT',
      };
      const created = await createAdmissionApplication(payload);
      setCurrentApplication(created);
      onApplicationChange(created);
      return created;
    } catch (error) {
      console.error('Failed to start application', error);
      showErrorToast('Unable to start application.');
      throw error;
    }
  }, [currentApplication, leadId, onApplicationChange, showErrorToast]);

  const debouncedSave = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (next: UpdateApplicationPayload) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(async () => {
        try {
          setSaving(true);
          const draft = currentApplication ?? (await handleCreateDraft());
          const updated = await updateAdmissionApplication(draft.id, next);
          setCurrentApplication(updated);
          onApplicationChange(updated);
        } catch (error) {
          console.error('Failed to save application', error);
          showErrorToast('Unable to save application changes.');
        } finally {
          setSaving(false);
        }
      }, 600);
    };
  }, [currentApplication, handleCreateDraft, onApplicationChange, showErrorToast]);

  const handleFieldChange = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));

      void debouncedSave({
        yearGroup: field === 'yearGroup' ? value : form.yearGroup,
        requestedStart:
          field === 'requestedStart' && value.length === DATE_INPUT_LENGTH ? new Date(value).toISOString() : form.requestedStart ? new Date(form.requestedStart).toISOString() : undefined,
        extraData: {
          programmeChoice: field === 'programmeChoice' ? value : form.programmeChoice,
          schedulePreferences: field === 'schedulePreferences' ? value : form.schedulePreferences,
          additionalNotes: field === 'additionalNotes' ? value : form.additionalNotes,
        },
      });
    },
    [debouncedSave, form.additionalNotes, form.programmeChoice, form.requestedStart, form.schedulePreferences, form.yearGroup],
  );

  const handleSubmitApplication = useCallback(async () => {
    try {
      const draft = currentApplication ?? (await handleCreateDraft());
      const updated = await updateAdmissionApplication(draft.id, {
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      });
      setCurrentApplication(updated);
      onApplicationChange(updated);
      showSuccessToast('Application submitted');
    } catch (error) {
      console.error('Failed to submit application', error);
      showErrorToast('Unable to submit application.');
    }
  }, [currentApplication, handleCreateDraft, onApplicationChange, showErrorToast, showSuccessToast]);

  const steps = [
    {
      title: 'Student placement',
      description: 'Set year group and requested start date',
    },
    {
      title: 'Programme preferences',
      description: 'Capture expectations and scheduling needs',
    },
    {
      title: 'Review & submit',
      description: 'Confirm details before submission',
    },
  ];

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-200/80" htmlFor="application-year-group">
                Year group
              </label>
              <input
                id="application-year-group"
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                placeholder="e.g. Primary 4"
                value={form.yearGroup}
                onChange={(event) => handleFieldChange('yearGroup', event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-200/80" htmlFor="application-start">
                Requested start date
              </label>
              <input
                id="application-start"
                type="date"
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                value={form.requestedStart}
                onChange={(event) => handleFieldChange('requestedStart', event.target.value)}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-200/80" htmlFor="application-programme">
                Programme choice
              </label>
              <textarea
                id="application-programme"
                rows={3}
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/60 focus:border-emerald-400 focus:outline-none"
                placeholder="Outline preferred programme, curriculum, or focus areas"
                value={form.programmeChoice}
                onChange={(event) => handleFieldChange('programmeChoice', event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-200/80" htmlFor="application-schedule">
                Scheduling preferences
              </label>
              <textarea
                id="application-schedule"
                rows={3}
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/60 focus:border-emerald-400 focus:outline-none"
                placeholder="Capture timing constraints or specific scheduling needs"
                value={form.schedulePreferences}
                onChange={(event) => handleFieldChange('schedulePreferences', event.target.value)}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/40 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">Summary</h3>
              <dl className="mt-3 space-y-2 text-sm text-emerald-100/80">
                <div className="flex justify-between gap-3">
                  <dt className="text-emerald-200/70">Year group</dt>
                  <dd>{form.yearGroup || 'Not set'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-emerald-200/70">Requested start</dt>
                  <dd>{form.requestedStart || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-emerald-200/70">Programme choice</dt>
                  <dd className="whitespace-pre-wrap">{form.programmeChoice || 'Not captured'}</dd>
                </div>
                <div>
                  <dt className="text-emerald-200/70">Scheduling preferences</dt>
                  <dd className="whitespace-pre-wrap">{form.schedulePreferences || 'Not captured'}</dd>
                </div>
                <div>
                  <dt className="text-emerald-200/70">Additional notes</dt>
                  <dd className="whitespace-pre-wrap">{form.additionalNotes || 'Not captured'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-200/80" htmlFor="application-notes">
                Additional notes to reviewers (optional)
              </label>
              <textarea
                id="application-notes"
                rows={4}
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/60 focus:border-emerald-400 focus:outline-none"
                placeholder="Share context that helps reviewers evaluate the application"
                value={form.additionalNotes}
                onChange={(event) => handleFieldChange('additionalNotes', event.target.value)}
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-700/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-600/50"
              onClick={handleSubmitApplication}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Submit application
            </button>
          </div>
        );
    }
  };

  if (!mounted || !portalTarget || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-end justify-end bg-emerald-950/80 backdrop-blur">
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-emerald-700/40 bg-emerald-900/95 shadow-2xl">
        <header className="flex items-center justify-between border-b border-emerald-700/40 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-200/70">Application</p>
            <h2 className="text-lg font-semibold text-white">Admission application</h2>
            <p className="text-xs text-emerald-200/60">Capture placement details and submit when ready.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-emerald-500/40 bg-emerald-800/30 p-2 text-emerald-100 transition hover:bg-emerald-700/40"
            onClick={onClose}
            aria-label="Close application drawer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ol className="space-y-4">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              return (
                <li key={step.title} className="flex gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-700 text-white'
                        : isCompleted
                        ? 'border-emerald-400 bg-emerald-600/70 text-white'
                        : 'border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : index + 1}
                  </div>
                  <div className={isActive ? 'flex-1 rounded-xl border border-emerald-500/40 bg-emerald-800/30 p-4' : 'flex-1 p-2'}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">{step.title}</h3>
                    <p className="text-xs text-emerald-200/60">{step.description}</p>
                    {isActive ? <div className="mt-4 space-y-4">{renderStepContent()}</div> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <footer className="flex items-center justify-between border-t border-emerald-700/40 px-6 py-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-800/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-700/50 disabled:opacity-50"
            onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
            disabled={activeStep === 0}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-800/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-700/50 disabled:opacity-50"
            onClick={() => setActiveStep((current) => Math.min(steps.length - 1, current + 1))}
            disabled={activeStep === steps.length - 1}
          >
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </footer>
      </aside>
    </div>,
    portalTarget,
  );
}
