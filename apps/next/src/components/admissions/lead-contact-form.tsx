"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  recordAdmissionLeadContact,
  type RecordLeadContactPayload,
} from '../../lib/api/admissions';
import { isApiError } from '../../lib/api/fetch-json';
import type { AdmissionContactChannel, AdmissionLead } from '../../lib/types/admissions';
import { useToastHelpers } from '../toast/toast-provider';

const CONTACT_CHANNEL_OPTIONS: AdmissionContactChannel[] = [
  'CALL',
  'EMAIL',
  'SMS',
  'IN_PERSON',
  'NOTE',
];

const DATE_TIME_INPUT_LENGTH = 16;

const getDefaultDateTimeLocal = (): string => {
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString();
  return iso.slice(0, DATE_TIME_INPUT_LENGTH);
};

type LeadContactFormProps = {
  lead: AdmissionLead;
  onUpdated: (lead: AdmissionLead) => void;
};

export function LeadContactForm({ lead, onUpdated }: LeadContactFormProps): JSX.Element {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [channel, setChannel] = useState<AdmissionContactChannel>('NOTE');
  const [summary, setSummary] = useState('');
  const [occurredAt, setOccurredAt] = useState<string>(() => getDefaultDateTimeLocal());
  const [saving, setSaving] = useState(false);

  const payload = useMemo<RecordLeadContactPayload>(() => {
    const trimmedSummary = summary.trim();
    const timestamp = occurredAt.trim();

    return {
      channel,
      summary: trimmedSummary,
      occurredAt: timestamp ? new Date(timestamp).toISOString() : undefined,
    } satisfies RecordLeadContactPayload;
  }, [channel, occurredAt, summary]);

  const isValid = payload.summary.length > 0;

  const resetForm = useCallback(() => {
    setChannel('NOTE');
    setSummary('');
    setOccurredAt(getDefaultDateTimeLocal());
  }, []);

  useEffect(() => {
    resetForm();
  }, [lead.id, resetForm]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isValid) {
        showErrorToast('Please add a short summary before saving the contact.');
        return;
      }

      setSaving(true);
      try {
        const updated = await recordAdmissionLeadContact(lead.id, payload);
        onUpdated(updated);
        resetForm();
        showSuccessToast('Contact logged successfully');
      } catch (error) {
        console.error('Failed to record lead contact', error);
        const message = isApiError(error) ? error.message : 'Unable to log contact right now. Please try again.';
        showErrorToast(message);
      } finally {
        setSaving(false);
      }
    },
    [isValid, lead.id, onUpdated, payload, resetForm, showErrorToast, showSuccessToast],
  );

  return (
    <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Log a contact</h3>
        <p className="mt-1 text-xs text-emerald-300/80">
          Record notes from a call, email, meeting, or internal update about this lead.
        </p>
      </header>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-contact-channel">
            Channel
            <select
              id="lead-contact-channel"
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              value={channel}
              onChange={(event) => setChannel(event.target.value as AdmissionContactChannel)}
              disabled={saving}
            >
              {CONTACT_CHANNEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-contact-occurred-at">
            Occurred at
            <input
              id="lead-contact-occurred-at"
              type="datetime-local"
              className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              disabled={saving}
            />
          </label>
        </div>

        <label className="flex flex-col text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-contact-summary">
          Summary
          <textarea
            id="lead-contact-summary"
            rows={4}
            className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Captured enquiry details, next steps, and key concerns."
            disabled={saving}
          />
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-800/50"
            onClick={resetForm}
            disabled={saving}
          >
            Clear
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500 disabled:opacity-40"
            disabled={saving || !isValid}
          >
            {saving ? 'Saving…' : 'Log contact'}
          </button>
        </div>
      </form>
    </section>
  );
}
