"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  updateAdmissionLeadStage,
  type UpdateLeadStagePayload,
} from '../../lib/api/admissions';
import { isApiError } from '../../lib/api/fetch-json';
import type { AdmissionLead, AdmissionLeadStage } from '../../lib/types/admissions';
import { useToastHelpers } from '../toast/toast-provider';
import { StageBadge } from './stage-badge';

const STAGE_ORDER: AdmissionLeadStage[] = [
  'NEW',
  'CONTACTED',
  'TASTER_BOOKED',
  'ATTENDED',
  'OFFER',
  'ACCEPTED',
  'ENROLLED',
  'ONBOARDED',
];

type LeadStageFormProps = {
  lead: AdmissionLead;
  onUpdated: (lead: AdmissionLead) => void;
};

const formatStageLabel = (stage: AdmissionLeadStage): string =>
  stage
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function LeadStageForm({ lead, onUpdated }: LeadStageFormProps): JSX.Element {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [toStage, setToStage] = useState<AdmissionLeadStage>(lead.stage);
  const [assignedStaffId, setAssignedStaffId] = useState(lead.assignedStaffId ?? '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setToStage(lead.stage);
    setAssignedStaffId(lead.assignedStaffId ?? '');
    setReason('');
  }, [lead.assignedStaffId, lead.stage]);

  const isDirty = toStage !== lead.stage || reason.trim().length > 0 || assignedStaffId.trim() !== (lead.assignedStaffId ?? '');

  const payload = useMemo<UpdateLeadStagePayload>(() => ({
    toStage,
    reason: reason.trim() || undefined,
    assignedStaffId: assignedStaffId.trim() || undefined,
  }), [assignedStaffId, reason, toStage]);

  const canSubmit = isDirty && toStage !== lead.stage;

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit) {
        showErrorToast('Select a new stage before updating.');
        return;
      }

      setSaving(true);
      try {
        const updated = await updateAdmissionLeadStage(lead.id, payload);
        onUpdated(updated);
        showSuccessToast('Lead stage updated');
      } catch (error) {
        console.error('Failed to update lead stage', error);
        const message = isApiError(error) ? error.message : 'Unable to update stage right now. Please try again.';
        showErrorToast(message);
      } finally {
        setSaving(false);
      }
    },
    [canSubmit, lead.id, onUpdated, payload, showErrorToast, showSuccessToast],
  );

  return (
    <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Progress stage</h3>
          <p className="mt-1 text-xs text-emerald-300/80">
            Move the lead through the enrolment pipeline and log a note explaining the change.
          </p>
        </div>
        <StageBadge stage={lead.stage} />
      </header>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-stage-select">
          New stage
          <select
            id="lead-stage-select"
            className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            value={toStage}
            onChange={(event) => setToStage(event.target.value as AdmissionLeadStage)}
            disabled={saving}
          >
            {STAGE_ORDER.map((stage) => (
              <option key={stage} value={stage}>
                {formatStageLabel(stage)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-stage-assignee">
          Assigned staff ID
          <input
            id="lead-stage-assignee"
            type="text"
            className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            value={assignedStaffId}
            onChange={(event) => setAssignedStaffId(event.target.value)}
            placeholder="Optional override"
            disabled={saving}
          />
        </label>

        <label className="flex flex-col text-xs uppercase tracking-wide text-emerald-300" htmlFor="lead-stage-reason">
          Reason / notes
          <textarea
            id="lead-stage-reason"
            rows={3}
            className="mt-2 w-full rounded-lg border border-emerald-700 bg-emerald-950/70 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add context for this change"
            disabled={saving}
          />
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-800/50"
            onClick={() => {
              setToStage(lead.stage);
              setAssignedStaffId(lead.assignedStaffId ?? '');
              setReason('');
            }}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500 disabled:opacity-40"
            disabled={saving || !canSubmit}
          >
            {saving ? 'Updating…' : 'Update stage'}
          </button>
        </div>
      </form>
    </section>
  );
}
