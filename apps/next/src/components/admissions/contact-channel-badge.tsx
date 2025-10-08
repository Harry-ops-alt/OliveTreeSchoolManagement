import type { AdmissionContactChannel } from '../../lib/types/admissions';

const CHANNEL_LABELS: Record<AdmissionContactChannel, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  SMS: 'SMS',
  IN_PERSON: 'In person',
  NOTE: 'Note',
};

const CHANNEL_STYLES: Record<AdmissionContactChannel, string> = {
  CALL: 'bg-emerald-800/30 border-emerald-500/50 text-emerald-100',
  EMAIL: 'bg-blue-800/30 border-blue-500/50 text-blue-100',
  SMS: 'bg-purple-800/30 border-purple-500/50 text-purple-100',
  IN_PERSON: 'bg-amber-800/30 border-amber-500/50 text-amber-100',
  NOTE: 'bg-slate-800/30 border-slate-500/50 text-slate-100',
};

export function ContactChannelBadge({ channel }: { channel: AdmissionContactChannel }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs uppercase tracking-wide ${CHANNEL_STYLES[channel]}`}
    >
      {CHANNEL_LABELS[channel]}
    </span>
  );
}
