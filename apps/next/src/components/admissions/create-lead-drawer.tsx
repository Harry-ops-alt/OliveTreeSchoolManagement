'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { createAdmissionLead, type CreateLeadPayload } from '../../lib/api/admissions';
import type { AdmissionLead } from '../../lib/types/admissions';
import { useToastHelpers } from '../toast/toast-provider';

const DATE_INPUT_LENGTH = 10;
const DATETIME_INPUT_LENGTH = 16;

type CreateLeadDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: AdmissionLead) => void;
};

type FormState = {
  branchId: string;
  assignedStaffId: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  studentFirstName: string;
  studentLastName: string;
  studentDateOfBirth: string;
  programmeInterest: string;
  preferredContactAt: string;
  source: string;
  notes: string;
  tags: string;
};

const INITIAL_FORM: FormState = {
  branchId: '',
  assignedStaffId: '',
  parentFirstName: '',
  parentLastName: '',
  parentEmail: '',
  parentPhone: '',
  studentFirstName: '',
  studentLastName: '',
  studentDateOfBirth: '',
  programmeInterest: '',
  preferredContactAt: '',
  source: '',
  notes: '',
  tags: '',
};

const sanitiseDate = (value: string): string | null => {
  if (!value.trim()) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toNullableString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const sanitiseId = (value: string): string | null => toNullableString(value);

const sanitiseTags = (value: string): string[] =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

const toDateInputValue = (value: string | null): string => {
  if (!value) {
    return '';
  }
  const iso = new Date(value).toISOString();
  return iso.slice(0, DATE_INPUT_LENGTH);
};

const toDateTimeInputValue = (value: string | null): string => {
  if (!value) {
    return '';
  }
  const iso = new Date(value).toISOString();
  return iso.slice(0, DATETIME_INPUT_LENGTH);
};

export function CreateLeadDrawer({ open, onClose, onCreated }: CreateLeadDrawerProps): JSX.Element | null {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      setForm(INITIAL_FORM);
    }
  }, [open]);

  const portalTarget = typeof window !== 'undefined' ? document.body : null;

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const payload = useMemo<CreateLeadPayload>(() => {
    const parentFirstName = form.parentFirstName.trim();
    const parentLastName = form.parentLastName.trim();
    const parentEmail = form.parentEmail.trim().toLowerCase();

    return {
      branchId: sanitiseId(form.branchId) ?? undefined,
      assignedStaffId: sanitiseId(form.assignedStaffId) ?? undefined,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhone: toNullableString(form.parentPhone) ?? undefined,
      studentFirstName: toNullableString(form.studentFirstName) ?? undefined,
      studentLastName: toNullableString(form.studentLastName) ?? undefined,
      studentDateOfBirth: sanitiseDate(form.studentDateOfBirth) ?? undefined,
      programmeInterest: toNullableString(form.programmeInterest) ?? undefined,
      preferredContactAt: sanitiseDate(form.preferredContactAt) ?? undefined,
      source: toNullableString(form.source) ?? undefined,
      notes: toNullableString(form.notes) ?? undefined,
      tags: sanitiseTags(form.tags),
    } satisfies CreateLeadPayload;
  }, [form]);

  const isValid = useMemo(() => {
    return (
      Boolean(form.parentFirstName.trim()) &&
      Boolean(form.parentLastName.trim()) &&
      Boolean(form.parentEmail.trim())
    );
  }, [form.parentEmail, form.parentFirstName, form.parentLastName]);

  const handleClose = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [onClose, saving]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isValid) {
        showErrorToast('Parent first name, last name, and email are required.');
        return;
      }

      setSaving(true);
      try {
        const created = await createAdmissionLead(payload);
        showSuccessToast('Lead created');
        onCreated(created);
        setForm(INITIAL_FORM);
      } catch (error) {
        console.error('Failed to create admission lead', error);
        showErrorToast('Unable to create lead. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [isValid, onCreated, payload, showErrorToast, showSuccessToast],
  );

  if (!mounted || !portalTarget || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close create lead drawer"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto border-l border-emerald-800/60 bg-emerald-950/95 p-6 text-emerald-50 shadow-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300/80">Admissions</p>
            <h2 className="text-2xl font-semibold text-white">New lead</h2>
            <p className="text-sm text-emerald-100/70">Capture an enquiry and add them to the pipeline.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-emerald-700/70 p-2 text-emerald-200 transition hover:bg-emerald-900"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Parent / Guardian</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-parent-first">
                  Parent first name
                </label>
                <input
                  id="create-parent-first"
                  type="text"
                  value={form.parentFirstName}
                  onChange={(event) => handleChange('parentFirstName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-parent-last">
                  Parent last name
                </label>
                <input
                  id="create-parent-last"
                  type="text"
                  value={form.parentLastName}
                  onChange={(event) => handleChange('parentLastName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-parent-email">
                  Parent email
                </label>
                <input
                  id="create-parent-email"
                  type="email"
                  value={form.parentEmail}
                  onChange={(event) => handleChange('parentEmail', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-parent-phone">
                  Parent phone
                </label>
                <input
                  id="create-parent-phone"
                  type="tel"
                  value={form.parentPhone}
                  onChange={(event) => handleChange('parentPhone', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-branch-id">
                  Branch ID
                </label>
                <input
                  id="create-branch-id"
                  type="text"
                  value={form.branchId}
                  onChange={(event) => handleChange('branchId', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-assigned-staff">
                  Assigned staff ID
                </label>
                <input
                  id="create-assigned-staff"
                  type="text"
                  value={form.assignedStaffId}
                  onChange={(event) => handleChange('assignedStaffId', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Student</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-student-first">
                  Student first name
                </label>
                <input
                  id="create-student-first"
                  type="text"
                  value={form.studentFirstName}
                  onChange={(event) => handleChange('studentFirstName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-student-last">
                  Student last name
                </label>
                <input
                  id="create-student-last"
                  type="text"
                  value={form.studentLastName}
                  onChange={(event) => handleChange('studentLastName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-student-dob">
                  Student date of birth
                </label>
                <input
                  id="create-student-dob"
                  type="date"
                  value={toDateInputValue(form.studentDateOfBirth)}
                  onChange={(event) => handleChange('studentDateOfBirth', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-preferred-contact">
                  Preferred contact time
                </label>
                <input
                  id="create-preferred-contact"
                  type="datetime-local"
                  value={toDateTimeInputValue(form.preferredContactAt)}
                  onChange={(event) => handleChange('preferredContactAt', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-programme-interest">
                  Programme interest
                </label>
                <input
                  id="create-programme-interest"
                  type="text"
                  value={form.programmeInterest}
                  onChange={(event) => handleChange('programmeInterest', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-source">
                  Lead source
                </label>
                <input
                  id="create-source"
                  type="text"
                  value={form.source}
                  onChange={(event) => handleChange('source', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-tags">
                Tags (comma separated)
              </label>
              <input
                id="create-tags"
                type="text"
                value={form.tags}
                onChange={(event) => handleChange('tags', event.target.value)}
                className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="create-notes">
                Notes
              </label>
              <textarea
                id="create-notes"
                rows={4}
                value={form.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </section>

          <footer className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-800/50"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500 disabled:opacity-40"
              disabled={saving || !isValid}
            >
              {saving ? 'Creating…' : 'Create lead'}
            </button>
          </footer>
        </form>
      </aside>
    </div>,
    portalTarget,
  );
}
