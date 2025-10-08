"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { updateAdmissionLead, type UpdateLeadPayload } from '../../lib/api/admissions';
import { isApiError } from '../../lib/api/fetch-json';
import type { AdmissionLead } from '../../lib/types/admissions';
import { useToastHelpers } from '../toast/toast-provider';

const DATE_INPUT_FORMAT_LENGTH = 10;
const DATETIME_INPUT_FORMAT_LENGTH = 16;

type LeadDetailsFormProps = {
  lead: AdmissionLead;
  onUpdated: (lead: AdmissionLead) => void;
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

const toDateInputValue = (value: string | null): string => {
  if (!value) {
    return '';
  }

  const iso = new Date(value).toISOString();
  return iso.slice(0, DATE_INPUT_FORMAT_LENGTH);
};

const toDateTimeInputValue = (value: string | null): string => {
  if (!value) {
    return '';
  }

  const iso = new Date(value).toISOString();
  return iso.slice(0, DATETIME_INPUT_FORMAT_LENGTH);
};

const buildFormState = (lead: AdmissionLead): FormState => ({
  branchId: lead.branchId ?? '',
  assignedStaffId: lead.assignedStaffId ?? '',
  parentFirstName: lead.parentFirstName ?? '',
  parentLastName: lead.parentLastName ?? '',
  parentEmail: lead.parentEmail ?? '',
  parentPhone: lead.parentPhone ?? '',
  studentFirstName: lead.studentFirstName ?? '',
  studentLastName: lead.studentLastName ?? '',
  studentDateOfBirth: toDateInputValue(lead.studentDateOfBirth),
  programmeInterest: lead.programmeInterest ?? '',
  preferredContactAt: toDateTimeInputValue(lead.preferredContactAt),
  source: lead.source ?? '',
  notes: lead.notes ?? '',
  tags: lead.tags.join(', '),
});

const sanitiseDateValue = (value: string): string | null => {
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

export function LeadDetailsForm({ lead, onUpdated }: LeadDetailsFormProps): JSX.Element {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [form, setForm] = useState<FormState>(() => buildFormState(lead));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildFormState(lead));
  }, [lead]);

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const payload = useMemo<UpdateLeadPayload>(() => ({
    branchId: sanitiseId(form.branchId) ?? undefined,
    assignedStaffId: sanitiseId(form.assignedStaffId) ?? undefined,
    parentFirstName: form.parentFirstName.trim(),
    parentLastName: form.parentLastName.trim(),
    parentEmail: form.parentEmail.trim(),
    parentPhone: (() => {
      const trimmed = form.parentPhone.trim();
      return trimmed.length ? trimmed : undefined;
    })(),
    studentFirstName: toNullableString(form.studentFirstName) ?? undefined,
    studentLastName: toNullableString(form.studentLastName) ?? undefined,
    studentDateOfBirth: sanitiseDateValue(form.studentDateOfBirth) ?? undefined,
    programmeInterest: toNullableString(form.programmeInterest) ?? undefined,
    preferredContactAt: sanitiseDateValue(form.preferredContactAt) ?? undefined,
    source: toNullableString(form.source) ?? undefined,
    notes: toNullableString(form.notes) ?? undefined,
    tags: sanitiseTags(form.tags),
  }), [form]);

  const isValid = useMemo(
    () =>
      Boolean(
        payload.parentFirstName &&
          payload.parentLastName &&
          payload.parentEmail,
      ),
    [payload.parentEmail, payload.parentFirstName, payload.parentLastName],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isValid) {
        showErrorToast('Parent name and email are required.');
        return;
      }

      setSaving(true);
      try {
        const updated = await updateAdmissionLead(lead.id, payload);
        onUpdated(updated);
        showSuccessToast('Lead details updated');
      } catch (error) {
        console.error('Failed to update admission lead', error);
        const message = isApiError(error) ? error.message : 'Unable to update lead. Please try again.';
        showErrorToast(message);
      } finally {
        setSaving(false);
      }
    },
    [isValid, lead.id, onUpdated, payload, showErrorToast, showSuccessToast],
  );

  const handleReset = useCallback(() => {
    setForm(buildFormState(lead));
  }, [lead]);

  return (
    <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Lead details</h3>
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-wide text-emerald-300 hover:text-emerald-100"
          onClick={handleReset}
          disabled={saving}
        >
          Reset
        </button>
      </header>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-branch-id">
              Branch ID
            </label>
            <input
              id="lead-branch-id"
              type="text"
              value={form.branchId}
              onChange={(event) => handleChange('branchId', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-assigned-staff">
              Assigned staff ID
            </label>
            <input
              id="lead-assigned-staff"
              type="text"
              value={form.assignedStaffId}
              onChange={(event) => handleChange('assignedStaffId', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-parent-first">
              Parent first name
            </label>
            <input
              id="lead-parent-first"
              type="text"
              value={form.parentFirstName}
              onChange={(event) => handleChange('parentFirstName', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-parent-last">
              Parent last name
            </label>
            <input
              id="lead-parent-last"
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
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-parent-email">
              Parent email
            </label>
            <input
              id="lead-parent-email"
              type="email"
              value={form.parentEmail}
              onChange={(event) => handleChange('parentEmail', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-parent-phone">
              Parent phone
            </label>
            <input
              id="lead-parent-phone"
              type="tel"
              value={form.parentPhone}
              onChange={(event) => handleChange('parentPhone', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-student-first">
              Student first name
            </label>
            <input
              id="lead-student-first"
              type="text"
              value={form.studentFirstName}
              onChange={(event) => handleChange('studentFirstName', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-student-last">
              Student last name
            </label>
            <input
              id="lead-student-last"
              type="text"
              value={form.studentLastName}
              onChange={(event) => handleChange('studentLastName', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-student-dob">
              Student date of birth
            </label>
            <input
              id="lead-student-dob"
              type="date"
              value={form.studentDateOfBirth}
              onChange={(event) => handleChange('studentDateOfBirth', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-preferred-contact">
              Preferred contact time
            </label>
            <input
              id="lead-preferred-contact"
              type="datetime-local"
              value={form.preferredContactAt}
              onChange={(event) => handleChange('preferredContactAt', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-programme-interest">
              Programme interest
            </label>
            <input
              id="lead-programme-interest"
              type="text"
              value={form.programmeInterest}
              onChange={(event) => handleChange('programmeInterest', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-source">
              Lead source
            </label>
            <input
              id="lead-source"
              type="text"
              value={form.source}
              onChange={(event) => handleChange('source', event.target.value)}
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-tags">
            Tags (comma separated)
          </label>
          <input
            id="lead-tags"
            type="text"
            value={form.tags}
            onChange={(event) => handleChange('tags', event.target.value)}
            className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-notes">
            Notes
          </label>
          <textarea
            id="lead-notes"
            rows={4}
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-800/50"
            onClick={handleReset}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500 disabled:opacity-40"
            disabled={saving || !isValid}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
