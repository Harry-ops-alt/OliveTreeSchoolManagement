import { Sparkles, PhoneCall, CalendarClock, Trophy, Award, BadgeCheck, GraduationCap, Rocket } from 'lucide-react';
import type { AdmissionLeadStage } from '../../lib/types/admissions';

const STAGE_LABELS: Record<AdmissionLeadStage, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  TASTER_BOOKED: 'Taster booked',
  ATTENDED: 'Attended',
  OFFER: 'Offer',
  ACCEPTED: 'Accepted',
  ENROLLED: 'Enrolled',
  ONBOARDED: 'Onboarded',
};

const STAGE_STYLES: Record<AdmissionLeadStage, { className: string; Icon: typeof Sparkles }> = {
  NEW: {
    className: 'from-emerald-400/20 via-emerald-500/20 to-emerald-600/20 text-emerald-100 border-emerald-400/50',
    Icon: Sparkles,
  },
  CONTACTED: {
    className: 'from-sky-400/20 via-sky-500/20 to-sky-600/20 text-sky-100 border-sky-400/50',
    Icon: PhoneCall,
  },
  TASTER_BOOKED: {
    className: 'from-indigo-400/20 via-indigo-500/20 to-indigo-600/20 text-indigo-100 border-indigo-400/50',
    Icon: CalendarClock,
  },
  ATTENDED: {
    className: 'from-purple-400/20 via-purple-500/20 to-purple-600/20 text-purple-100 border-purple-400/50',
    Icon: Trophy,
  },
  OFFER: {
    className: 'from-amber-400/20 via-amber-500/20 to-amber-600/20 text-amber-100 border-amber-400/50',
    Icon: Award,
  },
  ACCEPTED: {
    className: 'from-teal-400/20 via-teal-500/20 to-teal-600/20 text-teal-100 border-teal-400/50',
    Icon: BadgeCheck,
  },
  ENROLLED: {
    className: 'from-emerald-300/20 via-emerald-400/20 to-emerald-500/20 text-emerald-50 border-emerald-300/50',
    Icon: GraduationCap,
  },
  ONBOARDED: {
    className: 'from-cyan-300/20 via-cyan-400/20 to-cyan-500/20 text-cyan-50 border-cyan-300/50',
    Icon: Rocket,
  },
};

export function StageBadge({ stage }: { stage: AdmissionLeadStage }): JSX.Element {
  const { className, Icon } = STAGE_STYLES[stage];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {STAGE_LABELS[stage]}
    </span>
  );
}
