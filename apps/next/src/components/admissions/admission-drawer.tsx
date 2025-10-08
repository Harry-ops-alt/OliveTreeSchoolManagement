
'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CalendarDays,
  NotebookPen,
  UserCircle,
  Users,
  Tag,
  Clock3,
  Phone,
  Mail,
  GraduationCap,
  MapPin,
  StickyNote,
  ClipboardList,
  CheckCircle2,
  CircleDashed,
  FileText,
} from 'lucide-react';
import type {
  AdmissionLead,
  AdmissionLeadContact,
  AdmissionLeadStageHistory,
  AdmissionTask,
  AdmissionTaskStatus,
  AdmissionApplication,
} from '../../lib/types/admissions';
import { StageBadge } from './stage-badge';
import { ContactChannelBadge } from './contact-channel-badge';
import { LeadDetailsForm } from './lead-details-form';
import { LeadContactForm } from './lead-contact-form';
import { LeadStageForm } from './lead-stage-form';
import { ApplicationDrawer } from './application-drawer';

type AdmissionDrawerTab = 'overview' | 'timeline' | 'actions';

export interface AdmissionDrawerProps {
  lead: AdmissionLead | null;
  open: boolean;
  onClose: () => void;
  onLeadUpdated?: (lead: AdmissionLead) => void;
}

const formatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
});

const resolveTaskTimestamp = (task: AdmissionTask): string => {
  const fallback = new Date().toISOString();
  return task.completedAt ?? task.dueAt ?? fallback;
};

const renderTaskStatusIcon = (status: AdmissionTaskStatus) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />;
    case 'CANCELLED':
      return <CircleDashed className="h-3.5 w-3.5" aria-hidden />;
    default:
      return <ClipboardList className="h-3.5 w-3.5" aria-hidden />;
  }
};

type TimelineEntry =
  | { id: string; occurredAt: string; type: 'contact'; entry: AdmissionLeadContact }
  | { id: string; occurredAt: string; type: 'stage'; entry: AdmissionLeadStageHistory }
  | { id: string; occurredAt: string; type: 'task'; entry: AdmissionTask };

export function AdmissionDrawer({ lead, open, onClose, onLeadUpdated }: AdmissionDrawerProps): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AdmissionDrawerTab>('overview');
  const [currentLead, setCurrentLead] = useState<AdmissionLead | null>(null);
  const [applicationOpen, setApplicationOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!lead) {
      setCurrentLead(null);
      setActiveTab('overview');
      return;
    }

    setCurrentLead(lead);
  }, [lead]);

  const portalTarget = typeof window !== 'undefined' ? document.body : null;

  const lastContact = useMemo<AdmissionLeadContact | null>(() => {
    if (!currentLead?.contacts.length) {
      return null;
    }
    return currentLead.contacts[0];
  }, [currentLead]);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    if (!currentLead) {
      return [];
    }

    const contacts: TimelineEntry[] = currentLead.contacts.map((contact) => ({
      id: `contact-${contact.id}`,
      occurredAt: contact.occurredAt,
      type: 'contact',
      entry: contact,
    }));

    const stageHistory: TimelineEntry[] = currentLead.stageHistory.map((stage) => ({
      id: `stage-${stage.id}`,
      occurredAt: stage.changedAt,
      type: 'stage',
      entry: stage,
    }));

    const tasks: TimelineEntry[] = currentLead.tasks.map((task) => ({
      id: `task-${task.id}`,
      occurredAt: resolveTaskTimestamp(task),
      type: 'task',
      entry: task,
    }));

    return [...contacts, ...stageHistory, ...tasks].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }, [currentLead]);

  const preferredContactDisplay = useMemo(() => {
    if (!currentLead?.preferredContactAt) {
      return null;
    }

    try {
      return formatter.format(new Date(currentLead.preferredContactAt));
    } catch (error) {
      return currentLead.preferredContactAt;
    }
  }, [currentLead?.preferredContactAt]);

  const studentDobDisplay = useMemo(() => {
    if (!currentLead?.studentDateOfBirth) {
      return null;
    }

    try {
      return formatter.format(new Date(currentLead.studentDateOfBirth));
    } catch (error) {
      return currentLead.studentDateOfBirth;
    }
  }, [currentLead?.studentDateOfBirth]);

  const handleUpdated = (updated: AdmissionLead) => {
    setCurrentLead(updated);
    onLeadUpdated?.(updated);
  };

  const handleApplicationChange = (application: AdmissionApplication) => {
    setCurrentLead((current) => {
      if (!current) {
        return current;
      }

      const updated = { ...current, application };
      onLeadUpdated?.(updated);
      return updated;
    });
  };

  if (!mounted || !portalTarget || !open || !currentLead) {
    return null;
  }

  const renderOverview = () => (
    <div className="space-y-7">
      <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
          <UserCircle className="h-4 w-4" aria-hidden /> Parent / Guardian
        </h3>
        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <dt className="text-emerald-200/70">Name</dt>
            <dd className="text-emerald-50">
              {currentLead.parentFirstName} {currentLead.parentLastName}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-emerald-200/70">Contact</dt>
            <dd className="flex items-center gap-2 text-emerald-50">
              <Mail className="h-4 w-4 text-emerald-300/80" aria-hidden />
              {currentLead.parentEmail}
            </dd>
            {currentLead.parentPhone ? (
              <dd className="flex items-center gap-2 text-emerald-50">
                <Phone className="h-4 w-4 text-emerald-300/80" aria-hidden />
                {currentLead.parentPhone}
              </dd>
            ) : null}
          </div>
          {preferredContactDisplay ? (
            <div>
              <dt className="text-emerald-200/70">Preferred contact time</dt>
              <dd className="flex items-center gap-2 text-emerald-50">
                <Clock3 className="h-4 w-4 text-emerald-300/80" aria-hidden />
                {preferredContactDisplay}
              </dd>
            </div>
          ) : null}
          {currentLead.assignedStaff ? (
            <div>
              <dt className="text-emerald-200/70">Assigned staff</dt>
              <dd className="text-emerald-50">
                {currentLead.assignedStaff.firstName} {currentLead.assignedStaff.lastName}
                {currentLead.assignedStaff.role ? (
                  <span className="ml-2 rounded-full border border-emerald-500/50 bg-emerald-800/30 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-200/80">
                    {currentLead.assignedStaff.role.replace(/_/g, ' ')}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
          <Users className="h-4 w-4" aria-hidden /> Student
        </h3>
        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <dt className="text-emerald-200/70">Name</dt>
            <dd className="text-emerald-50">
              {currentLead.studentFirstName || currentLead.studentLastName
                ? `${currentLead.studentFirstName ?? ''} ${currentLead.studentLastName ?? ''}`.trim()
                : 'Not captured'}
            </dd>
          </div>
          <div>
            <dt className="text-emerald-200/70">Programme interest</dt>
            <dd className="flex items-center gap-2 text-emerald-50">
              <GraduationCap className="h-4 w-4 text-emerald-300/80" aria-hidden />
              {currentLead.programmeInterest ?? 'Not specified'}
            </dd>
          </div>
          {studentDobDisplay ? (
            <div className="flex items-center gap-2 text-emerald-50">
              <CalendarDays className="h-4 w-4 text-emerald-300/80" aria-hidden />
              Date of birth {studentDobDisplay}
            </div>
          ) : null}
        </dl>
        {currentLead.branch ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-50">
            <MapPin className="h-4 w-4 text-emerald-300/80" aria-hidden />
            Branch {currentLead.branch.name}
          </div>
        ) : null}
        {currentLead.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentLead.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-800/30 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200/80"
              >
                <Tag className="h-3 w-3" aria-hidden />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {currentLead.notes?.trim() ? (
        <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
            <StickyNote className="h-4 w-4" aria-hidden /> Notes
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-100/80">
            {currentLead.notes}
          </p>
        </section>
      ) : null}
      {currentLead.tasks.length ? (
        <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
            <ClipboardList className="h-4 w-4" aria-hidden /> Tasks overview
          </h3>
          <p className="text-sm text-emerald-100/80">
            {currentLead.tasks.filter((task) => task.status === 'COMPLETED').length} of {currentLead.tasks.length} tasks completed.
          </p>
        </section>
      ) : null}
      <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
            <FileText className="h-4 w-4" aria-hidden /> Application
          </div>
          <button
            type="button"
            className="rounded-lg border border-emerald-500/40 bg-emerald-800/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-700/40"
            onClick={() => setApplicationOpen(true)}
          >
            {currentLead.application ? 'View application' : 'Start application'}
          </button>
        </div>
        {currentLead.application ? (
          <dl className="space-y-2 text-sm text-emerald-100/80">
            <div className="flex justify-between gap-3">
              <dt className="text-emerald-200/70">Status</dt>
              <dd className="rounded-full border border-emerald-500/40 bg-emerald-800/30 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-100">
                {currentLead.application.status.replace(/_/g, ' ')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-emerald-200/70">Year group</dt>
              <dd>{currentLead.application.yearGroup ?? 'Not set'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-emerald-200/70">Requested start</dt>
              <dd>{currentLead.application.requestedStart ? formatter.format(new Date(currentLead.application.requestedStart)) : 'Not set'}</dd>
            </div>
            {currentLead.application.decision ? (
              <div className="flex justify-between gap-3">
                <dt className="text-emerald-200/70">Decision</dt>
                <dd>{currentLead.application.decision.replace(/_/g, ' ')}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-emerald-200/70">No application captured yet.</p>
        )}
      </section>
    </div>
  );

  const renderHighlights = () => (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
          <NotebookPen className="h-4 w-4" aria-hidden /> Latest contact
        </h3>
        {lastContact ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-emerald-50">
              <ContactChannelBadge channel={lastContact.channel} />
              {lastContact.occurredAt ? formatter.format(new Date(lastContact.occurredAt)) : null}
            </div>
            <p className="whitespace-pre-wrap text-emerald-100/80">{lastContact.summary}</p>
            {lastContact.user ? (
              <p className="text-xs text-emerald-200/70">
                By {lastContact.user.firstName} {lastContact.user.lastName}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-emerald-200/70">No contact recorded yet.</p>
        )}
      </div>
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
          <Clock3 className="h-4 w-4" aria-hidden /> Stage history
        </h3>
        <div className="space-y-3 text-sm">
          {currentLead.stageHistory.length ? (
            currentLead.stageHistory.slice(0, 4).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-emerald-800/40 bg-emerald-900/30 p-3">
                <div className="flex items-center justify-between">
                  <StageBadge stage={entry.toStage} />
                  <span className="text-xs text-emerald-200/70">
                    {formatter.format(new Date(entry.changedAt))}
                  </span>
                </div>
                {entry.reason ? <p className="mt-2 text-emerald-100/80">{entry.reason}</p> : null}
                {entry.changedBy ? (
                  <p className="mt-2 text-xs text-emerald-300/70">
                    by {entry.changedBy.firstName} {entry.changedBy.lastName}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-emerald-200/70">No stage changes recorded.</p>
          )}
        </div>
      </div>
    </section>
  );

  const renderTimeline = () => (
    <section className="space-y-4">
      {timelineEntries.length ? (
        timelineEntries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-200/70">
              <span>
                {entry.type === 'contact'
                  ? 'Contact'
                  : entry.type === 'stage'
                    ? 'Stage change'
                    : 'Task'}{' '}
                · {formatter.format(new Date(entry.occurredAt))}
              </span>
              {entry.type === 'contact' ? (
                <ContactChannelBadge channel={entry.entry.channel} />
              ) : entry.type === 'stage' ? (
                <StageBadge stage={entry.entry.toStage} />
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/60 bg-emerald-900/60 px-2 py-1 text-[11px] uppercase tracking-wide text-emerald-200">
                  {renderTaskStatusIcon(entry.entry.status)}
                  {entry.entry.status.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="mt-3 text-sm text-emerald-100/80">
              {entry.type === 'contact' ? (
                <Fragment>
                  <p className="whitespace-pre-wrap">{entry.entry.summary}</p>
                  {entry.entry.user ? (
                    <p className="mt-2 text-xs text-emerald-300/70">
                      by {entry.entry.user.firstName} {entry.entry.user.lastName}
                    </p>
                  ) : null}
                </Fragment>
              ) : entry.type === 'stage' ? (
                <Fragment>
                  {entry.entry.reason ? (
                    <p className="whitespace-pre-wrap">{entry.entry.reason}</p>
                  ) : (
                    <p className="text-emerald-200/70">Stage progressed</p>
                  )}
                  {entry.entry.changedBy ? (
                    <p className="mt-2 text-xs text-emerald-300/70">
                      by {entry.entry.changedBy.firstName} {entry.entry.changedBy.lastName}
                    </p>
                  ) : null}
                </Fragment>
              ) : (
                <Fragment>
                  <p className="whitespace-pre-wrap">{entry.entry.description ?? 'Task updated'}</p>
                  <div className="mt-2 grid gap-2 text-xs text-emerald-300/70 md:grid-cols-2">
                    {entry.entry.dueAt ? (
                      <span>Due {formatter.format(new Date(entry.entry.dueAt))}</span>
                    ) : null}
                    {entry.entry.assignee ? (
                      <span>
                        Assigned to {entry.entry.assignee.firstName ?? ''} {entry.entry.assignee.lastName ?? ''}
                      </span>
                    ) : null}
                  </div>
                </Fragment>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-emerald-200/70">No timeline entries recorded yet.</p>
      )}
    </section>
  );

  const renderActions = () => (
    <div className="space-y-5">
      <LeadStageForm lead={currentLead} onUpdated={handleUpdated} />
      <LeadContactForm lead={currentLead} onUpdated={handleUpdated} />
      <LeadDetailsForm lead={currentLead} onUpdated={handleUpdated} />
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'timeline') {
      return renderTimeline();
    }

    if (activeTab === 'actions') {
      return renderActions();
    }

    return (
      <div className="space-y-7">
        {renderOverview()}
        {renderHighlights()}
        {currentLead.application ? (
          <section className="rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-200">
              <NotebookPen className="h-4 w-4" aria-hidden /> Application summary
            </h3>
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <dt className="text-emerald-200/70">Status</dt>
                <dd className="text-emerald-50">{currentLead.application.status}</dd>
              </div>
              {currentLead.application.yearGroup ? (
                <div>
                  <dt className="text-emerald-200/70">Year group</dt>
                  <dd className="text-emerald-50">{currentLead.application.yearGroup}</dd>
                </div>
              ) : null}
              {currentLead.application.requestedStart ? (
                <div>
                  <dt className="text-emerald-200/70">Requested start</dt>
                  <dd className="text-emerald-50">
                    {formatter.format(new Date(currentLead.application.requestedStart))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}
      </div>
    );
  };

  const drawerPortal = createPortal(
    <div className="fixed inset-0 z-[10000] flex justify-end">
      {applicationOpen ? (
        <div aria-hidden className="absolute inset-0 bg-transparent pointer-events-none transition-opacity" />
      ) : (
        <button
          type="button"
          aria-label="Close admissions drawer"
          className="absolute inset-0 bg-black/40 transition-opacity"
          onClick={onClose}
        />
      )}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={
          currentLead.studentFirstName || currentLead.studentLastName
            ? `Lead details for ${currentLead.studentFirstName ?? ''} ${currentLead.studentLastName ?? ''}`.trim()
            : `Lead details for ${currentLead.parentFirstName} ${currentLead.parentLastName}`
        }
        className="relative flex h-full w-full max-w-3xl flex-col bg-emerald-950 text-emerald-50 shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-emerald-800/50 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300/80">Admission Lead</p>
            <h2 className="text-xl font-semibold text-white">
              {currentLead.studentFirstName && currentLead.studentLastName
                ? `${currentLead.studentFirstName} ${currentLead.studentLastName}`
                : `${currentLead.parentFirstName} ${currentLead.parentLastName}`}
            </h2>
            <p className="text-xs text-emerald-200/70">
              Created {formatter.format(new Date(currentLead.createdAt))}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StageBadge stage={currentLead.stage} />
            <button
              type="button"
              onClick={onClose}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>
        <div className="flex items-center justify-between border-b border-emerald-900/30 px-6">
          <nav className="flex items-center gap-3 py-2 text-xs uppercase tracking-wide text-emerald-300">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-md px-3 py-2 transition ${
                activeTab === 'overview'
                  ? 'bg-emerald-800 text-white shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/40'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`rounded-md px-3 py-2 transition ${
                activeTab === 'timeline'
                  ? 'bg-emerald-800 text-white shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/40'
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`rounded-md px-3 py-2 transition ${
                activeTab === 'actions'
                  ? 'bg-emerald-800 text-white shadow'
                  : 'text-emerald-200 hover:text-white hover:bg-emerald-800/40'
              }`}
            >
              Manage lead
            </button>
          </nav>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 text-emerald-100/80">
          {renderContent()}
        </div>
      </aside>
    </div>,
    portalTarget,
  );

  return (
    <>
      {drawerPortal}
      <ApplicationDrawer
        leadId={currentLead.id}
        open={applicationOpen}
        application={currentLead.application}
        onClose={() => setApplicationOpen(false)}
        onApplicationChange={handleApplicationChange}
      />
    </>
  );
}
