'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { CalendarClock, ChevronDown, ChevronUp, Filter, PlusCircle, Search, Users, X } from 'lucide-react';
import {
  listAdmissionLeads,
  bulkUpdateAdmissionLeadStage,
  bulkAssignAdmissionLeadStaff,
  listAdmissionLeadViews,
  createAdmissionLeadView,
  updateAdmissionLeadView,
  deleteAdmissionLeadView,
} from '../../../lib/api/admissions';
import { listBranches } from '../../../lib/api/branches';
import { ApiError } from '../../../lib/api/fetch-json';
import { useToastHelpers } from '../../../components/toast/toast-provider';
import { AdmissionsCardsSkeleton } from '../../../components/skeletons/admissions-cards';
import { AdmissionDrawer } from '../../../components/admissions/admission-drawer';
import { CreateLeadDrawer } from '../../../components/admissions/create-lead-drawer';
import type {
  AdmissionLead,
  AdmissionLeadStage,
  AdmissionLeadListParams,
  AdmissionLeadSavedView,
} from '../../../lib/types/admissions';
import type { Branch } from '../../../lib/types/branches';
import { StageBadge } from '../../../components/admissions/stage-badge';
import { ContactChannelBadge } from '../../../components/admissions/contact-channel-badge';
import { SavedViewsMenu } from '../../../components/admissions/saved-views-menu';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
});

type FilterState = {
  branchIds: string[];
  stages: AdmissionLeadStage[];
  assignedStaffIds: string[];
  tags: string[];
  search: string;
};

type FilterSectionKey = 'segmentation' | 'pipeline' | 'ownership';

type ActiveFilterChip = {
  key: string;
  label: ReactNode;
  remove: () => void;
};

const INITIAL_FILTER_STATE: FilterState = {
  branchIds: [],
  stages: [],
  assignedStaffIds: [],
  tags: [],
  search: '',
};

const STAGE_VALUES: readonly AdmissionLeadStage[] = [
  'NEW',
  'CONTACTED',
  'TASTER_BOOKED',
  'ATTENDED',
  'OFFER',
  'ACCEPTED',
  'ENROLLED',
  'ONBOARDED',
] as const;

const formatStageLabel = (stage: AdmissionLeadStage): string =>
  stage
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const STAGE_OPTIONS: { value: AdmissionLeadStage; label: string }[] = STAGE_VALUES.map((stage) => ({
  value: stage,
  label: formatStageLabel(stage),
}));

const normaliseStage = (value: string): AdmissionLeadStage | null => {
  const upper = value.toUpperCase() as AdmissionLeadStage;
  return STAGE_VALUES.includes(upper) ? upper : null;
};

const toSelectedValues = (event: React.ChangeEvent<HTMLSelectElement>): string[] =>
  Array.from(event.target.selectedOptions, (option) => option.value);

export default function AdmissionsPage(): JSX.Element {
  const { error: showErrorToast, success: showSuccessToast } = useToastHelpers();
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [leads, setLeads] = useState<AdmissionLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLead, setDrawerLead] = useState<AdmissionLead | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<AdmissionLeadSavedView[]>([]);
  const [savedViewsLoading, setSavedViewsLoading] = useState(false);
  const [savedViewsSaving, setSavedViewsSaving] = useState(false);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<AdmissionLeadStage | ''>('');
  const [bulkStageReason, setBulkStageReason] = useState('');
  const [bulkStageAssigneeId, setBulkStageAssigneeId] = useState('');
  const [bulkAssignStaffId, setBulkAssignStaffId] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<FilterSectionKey, boolean>>({
    segmentation: false,
    pipeline: false,
    ownership: false,
  });
  const [ownerInput, setOwnerInput] = useState('');

  const primaryBranchId = useMemo(
    () => (filters.branchIds.length === 1 ? filters.branchIds[0] : undefined),
    [filters.branchIds],
  );

  const loadLeads = useCallback(
    async (params: AdmissionLeadListParams) => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await listAdmissionLeads(params);
        setLeads(response.items);
        setTotal(response.total);
        setAvailableTags((current) => {
          const next = new Set(current);
          response.items.forEach((lead) => lead.tags.forEach((tag) => next.add(tag)));
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });
        setSelectedLeadIds((current) => current.filter((id) => response.items.some((lead) => lead.id === id)));
      } catch (error) {
        console.error('Failed to load admission leads', error);
        setLoadError('Unable to load admissions right now. Please try again shortly.');
        if (!(error instanceof ApiError && error.status === 404)) {
          showErrorToast('Unable to load admissions data.');
        }
      } finally {
        setLoading(false);
      }
    },
    [showErrorToast],
  );

  const buildListParams = useCallback(
    (): AdmissionLeadListParams => ({
      branchIds: filters.branchIds,
      stages: filters.stages as AdmissionLeadStage[],
      assignedStaffIds: filters.assignedStaffIds,
      tags: filters.tags,
      search: filters.search.trim() || undefined,
      page,
      pageSize,
    }),
    [filters.assignedStaffIds, filters.branchIds, filters.search, filters.stages, filters.tags, page, pageSize],
  );

  const viewFiltersToState = useCallback(
    (viewFilters: Partial<AdmissionLeadListParams> | undefined): FilterState => {
      const branchCandidates: string[] = Array.isArray(viewFilters?.branchIds)
        ? viewFilters.branchIds.filter((value): value is string => typeof value === 'string')
        : [];
      if (!branchCandidates.length && typeof viewFilters?.branchId === 'string' && viewFilters.branchId.length) {
        branchCandidates.push(viewFilters.branchId);
      }

      const stageCandidatesRaw: unknown[] = Array.isArray(viewFilters?.stages)
        ? viewFilters.stages
        : typeof viewFilters?.stage === 'string'
        ? [viewFilters.stage]
        : [];
      const stageCandidates = stageCandidatesRaw
        .map((candidate) => (typeof candidate === 'string' ? normaliseStage(candidate) : null))
        .filter((value): value is AdmissionLeadStage => value !== null);

      const assignedStaffCandidates: string[] = Array.isArray(viewFilters?.assignedStaffIds)
        ? viewFilters.assignedStaffIds.filter((value): value is string => typeof value === 'string')
        : [];
      if (!assignedStaffCandidates.length && typeof viewFilters?.assignedStaffId === 'string' && viewFilters.assignedStaffId.length) {
        assignedStaffCandidates.push(viewFilters.assignedStaffId);
      }

      const tagCandidates: string[] = Array.isArray(viewFilters?.tags)
        ? viewFilters.tags.filter((value): value is string => typeof value === 'string')
        : [];

      const searchValue = typeof viewFilters?.search === 'string' ? viewFilters.search : '';

      return {
        branchIds: branchCandidates,
        stages: stageCandidates,
        assignedStaffIds: assignedStaffCandidates,
        tags: tagCandidates,
        search: searchValue,
      };
    },
    [],
  );

  useEffect(() => {
    void loadLeads(buildListParams());
  }, [buildListParams, loadLeads]);

  useEffect(() => {
    void (async () => {
      try {
        const branches = await listBranches();
        setAvailableBranches(branches);
      } catch (error) {
        console.error('Failed to load branches', error);
      }
    })();
  }, []);

  const loadSavedViews = useCallback(async () => {
    setSavedViewsLoading(true);
    try {
      const response = await listAdmissionLeadViews(primaryBranchId ? { branchId: primaryBranchId } : undefined);
      setSavedViews(response);
      setActiveSavedViewId((current) => (current && response.some((view) => view.id === current) ? current : null));
    } catch (error) {
      console.error('Failed to load saved lead views', error);
      showErrorToast('Unable to load saved views.');
    } finally {
      setSavedViewsLoading(false);
    }
  }, [primaryBranchId, showErrorToast]);

  useEffect(() => {
    void loadSavedViews();
  }, [loadSavedViews]);

  const toggleSection = useCallback((section: FilterSectionKey) => {
    setCollapsedSections((current) => ({ ...current, [section]: !current[section] }));
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleFilterChange = useCallback((next: Partial<FilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
    setActiveSavedViewId(null);
  }, []);

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.search.trim()) {
      chips.push({
        key: 'search',
        label: (
          <span className="inline-flex items-center gap-1">
            <Search className="h-3.5 w-3.5" aria-hidden /> {filters.search.trim()}
          </span>
        ),
        remove: () => handleFilterChange({ search: '' }),
      });
    }

    filters.branchIds.forEach((branchId) => {
      const branch = availableBranches.find((candidate) => candidate.id === branchId);
      chips.push({
        key: `branch-${branchId}`,
        label: branch ? branch.name : branchId,
        remove: () => handleFilterChange({ branchIds: filters.branchIds.filter((id) => id !== branchId) }),
      });
    });

    filters.stages.forEach((stage) => {
      chips.push({
        key: `stage-${stage}`,
        label: formatStageLabel(stage),
        remove: () => handleFilterChange({ stages: filters.stages.filter((value) => value !== stage) }),
      });
    });

    filters.tags.forEach((tag) => {
      chips.push({
        key: `tag-${tag}`,
        label: `#${tag}`,
        remove: () => handleFilterChange({ tags: filters.tags.filter((value) => value !== tag) }),
      });
    });

    filters.assignedStaffIds.forEach((staffId) => {
      chips.push({
        key: `owner-${staffId}`,
        label: (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden /> {staffId}
          </span>
        ),
        remove: () =>
          handleFilterChange({
            assignedStaffIds: filters.assignedStaffIds.filter((value) => value !== staffId),
          }),
      });
    });

    return chips;
  }, [availableBranches, filters.assignedStaffIds, filters.branchIds, filters.search, filters.stages, filters.tags, handleFilterChange]);

  const resetAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
    setOwnerInput('');
    setPage(1);
    setActiveSavedViewId(null);
  }, []);

  const handleBranchToggle = useCallback(
    (branchId: string) => {
      const next = filters.branchIds.includes(branchId)
        ? filters.branchIds.filter((id) => id !== branchId)
        : [...filters.branchIds, branchId];
      handleFilterChange({ branchIds: next });
    },
    [filters.branchIds, handleFilterChange],
  );

  const handleStageToggle = useCallback(
    (stage: AdmissionLeadStage) => {
      const next = filters.stages.includes(stage)
        ? filters.stages.filter((value) => value !== stage)
        : [...filters.stages, stage];
      handleFilterChange({ stages: next });
    },
    [filters.stages, handleFilterChange],
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const next = filters.tags.includes(tag)
        ? filters.tags.filter((value) => value !== tag)
        : [...filters.tags, tag];
      handleFilterChange({ tags: next });
    },
    [filters.tags, handleFilterChange],
  );

  const addOwnerId = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      const next = Array.from(new Set([...filters.assignedStaffIds, trimmed]));
      handleFilterChange({ assignedStaffIds: next });
      setOwnerInput('');
    },
    [filters.assignedStaffIds, handleFilterChange],
  );

  const handleOwnerInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setOwnerInput(event.target.value);
  }, []);

  const handleOwnerInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addOwnerId(ownerInput);
      } else if (event.key === 'Backspace' && ownerInput.length === 0 && filters.assignedStaffIds.length) {
        event.preventDefault();
        handleFilterChange({ assignedStaffIds: filters.assignedStaffIds.slice(0, -1) });
      }
    },
    [addOwnerId, filters.assignedStaffIds, handleFilterChange, ownerInput],
  );

  const handleOwnerInputBlur = useCallback(() => {
    if (ownerInput.trim()) {
      addOwnerId(ownerInput);
    }
  }, [addOwnerId, ownerInput]);

  const handleOwnerPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const text = event.clipboardData.getData('text');
      if (!text) {
        return;
      }
      event.preventDefault();
      const tokens = text
        .split(/[\s,]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0);
      if (!tokens.length) {
        return;
      }
      const next = Array.from(new Set([...filters.assignedStaffIds, ...tokens]));
      handleFilterChange({ assignedStaffIds: next });
      setOwnerInput('');
    },
    [filters.assignedStaffIds, handleFilterChange],
  );

  const handleManualRefresh = useCallback(() => {
    void loadLeads(buildListParams());
  }, [buildListParams, loadLeads]);

  const applySavedView = useCallback(
    (view: AdmissionLeadSavedView) => {
      const state = viewFiltersToState(view.filters);
      setFilters(state);
      setActiveSavedViewId(view.id);
      setPage(1);
    },
    [viewFiltersToState],
  );

  const saveCurrentFilters = useCallback(
    async (options?: { setAsDefault?: boolean }) => {
      setSavedViewsSaving(true);
      try {
        const response = await createAdmissionLeadView({
          name: `View ${new Date().toLocaleString()}`,
          filters: buildListParams(),
          isDefault: options?.setAsDefault,
          sharedWithOrg: false,
        });
        setSavedViews((current) => [response, ...current]);
        setActiveSavedViewId(response.id);
        showSuccessToast('Saved current filters.');
      } catch (error) {
        console.error('Failed to save lead view', error);
        showErrorToast('Unable to save current filters.');
      } finally {
        setSavedViewsSaving(false);
      }
    },
    [buildListParams, showErrorToast, showSuccessToast],
  );

  const setDefaultView = useCallback(
    async (view: AdmissionLeadSavedView) => {
      try {
        const updated = await updateAdmissionLeadView(view.id, { isDefault: true });
        setSavedViews((current) =>
          current.map((candidate) => ({
            ...candidate,
            isDefault: candidate.id === updated.id,
          })),
        );
        showSuccessToast('Default view updated.');
      } catch (error) {
        console.error('Failed to update default lead view', error);
        showErrorToast('Unable to update default view.');
      }
    },
    [showErrorToast, showSuccessToast],
  );

  const renameSavedView = useCallback(
    async (view: AdmissionLeadSavedView, name: string) => {
      try {
        const updated = await updateAdmissionLeadView(view.id, { name });
        setSavedViews((current) =>
          current.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
        );
        showSuccessToast('View renamed.');
      } catch (error) {
        console.error('Failed to rename lead view', error);
        showErrorToast('Unable to rename view.');
      }
    },
    [showErrorToast, showSuccessToast],
  );

  const deleteSavedView = useCallback(
    async (view: AdmissionLeadSavedView) => {
      try {
        await deleteAdmissionLeadView(view.id);
        setSavedViews((current) => current.filter((candidate) => candidate.id !== view.id));
        setActiveSavedViewId((current) => (current === view.id ? null : current));
        showSuccessToast('View deleted.');
      } catch (error) {
        console.error('Failed to delete lead view', error);
        showErrorToast('Unable to delete view.');
      }
    },
    [showErrorToast, showSuccessToast],
  );

  const renderFilterSection = (
    section: FilterSectionKey,
    title: string,
    description: string,
    children: ReactNode,
  ): JSX.Element => {
    const collapsed = collapsedSections[section];

    return (
      <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/50 shadow-inner shadow-emerald-950/30">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-emerald-900/40"
          onClick={() => toggleSection(section)}
          aria-expanded={!collapsed}
        >
          <div>
            <p className="text-sm font-semibold text-emerald-50">{title}</p>
            <p className="text-xs text-emerald-300/70">{description}</p>
          </div>
          {collapsed ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronUp className="h-4 w-4" aria-hidden />}
        </button>
        {!collapsed ? <div className="border-t border-emerald-800/40 px-5 pb-5 pt-4">{children}</div> : null}
      </div>
    );
  };

  const handleToggleSelect = useCallback((leadId: string, checked: boolean) => {
    setSelectedLeadIds((current) => {
      if (checked) {
        if (current.includes(leadId)) {
          return current;
        }
        return [...current, leadId];
      }
      return current.filter((id) => id !== leadId);
    });
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedLeadIds(leads.map((lead) => lead.id));
      } else {
        setSelectedLeadIds([]);
      }
    },
    [leads],
  );

  const mergeUpdatedLeads = useCallback((updated: AdmissionLead[]) => {
    setLeads((current) => {
      const map = new Map(current.map((lead) => [lead.id, lead] as const));
      updated.forEach((lead) => map.set(lead.id, lead));
      return Array.from(map.values());
    });
  }, []);

  const resetBulkForms = useCallback(() => {
    setBulkStage('');
    setBulkStageReason('');
    setBulkStageAssigneeId('');
    setBulkAssignStaffId('');
  }, []);

  const handleBulkStageUpdate = useCallback(async () => {
    if (!bulkStage || !selectedLeadIds.length) {
      showErrorToast('Select at least one lead and a target stage.');
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await bulkUpdateAdmissionLeadStage({
        leadIds: selectedLeadIds,
        toStage: bulkStage,
        reason: bulkStageReason.trim() || undefined,
        assignedStaffId: bulkStageAssigneeId.trim() || undefined,
      });
      mergeUpdatedLeads(response.updated);
      setSelectedLeadIds([]);
      resetBulkForms();
      showSuccessToast('Lead stages updated');
    } catch (error) {
      console.error('Failed to bulk update stages', error);
      showErrorToast('Unable to update stages.');
    } finally {
      setBulkActionLoading(false);
    }
  }, [bulkStage, bulkStageAssigneeId, bulkStageReason, mergeUpdatedLeads, resetBulkForms, selectedLeadIds, showErrorToast, showSuccessToast]);

  const handleBulkAssignStaff = useCallback(async () => {
    if (!selectedLeadIds.length) {
      showErrorToast('Select at least one lead to assign.');
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await bulkAssignAdmissionLeadStaff({
        leadIds: selectedLeadIds,
        assignedStaffId: bulkAssignStaffId.trim() || undefined,
      });
      mergeUpdatedLeads(response.updated);
      setSelectedLeadIds([]);
      resetBulkForms();
      showSuccessToast('Lead assignments updated');
    } catch (error) {
      console.error('Failed to bulk assign staff', error);
      showErrorToast('Unable to update assignments.');
    } finally {
      setBulkActionLoading(false);
    }
  }, [bulkAssignStaffId, mergeUpdatedLeads, resetBulkForms, selectedLeadIds, showErrorToast, showSuccessToast]);

  const handleOpenDrawer = useCallback((lead: AdmissionLead) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerLead(null);
  }, []);

  const handleOpenCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setCreateDrawerOpen(false);
  }, []);

  const handleLeadUpdated = useCallback((updated: AdmissionLead) => {
    setLeads((current) => current.map((lead) => (lead.id === updated.id ? updated : lead)));
    setDrawerLead(updated);
  }, []);

  const handleLeadCreated = useCallback(
    async (created: AdmissionLead) => {
      setCreateDrawerOpen(false);
      setLeads((current) => {
        const filtered = current.filter((lead) => lead.id !== created.id);
        return [created, ...filtered];
      });
      setTotal((current) => {
        const alreadyCounted = leads.some((lead) => lead.id === created.id);
        return alreadyCounted ? current : current + 1;
      });
      setDrawerLead(created);
      setDrawerOpen(true);
      await loadLeads(buildListParams());
    },
    [buildListParams, loadLeads, leads],
  );

  const leaderboard = useMemo(() => {
    if (!leads.length) {
      return null;
    }

    return leads.map((lead) => {
      const createdDate = dateFormatter.format(new Date(lead.createdAt));
      const latestContact = lead.contacts[0];
      const initials = (lead.studentFirstName ?? lead.parentFirstName ?? '?').charAt(0) + (lead.studentLastName ?? lead.parentLastName ?? '').charAt(0);

      return (
        <li
          key={lead.id}
          className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-950/70 p-6 shadow-lg shadow-emerald-950/40 transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-emerald-900/60"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/0 to-emerald-400/10 opacity-0 transition group-hover:opacity-100" />
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-lg font-semibold text-emerald-100">
                  {initials.toUpperCase()}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-white">
                      {lead.studentFirstName && lead.studentLastName
                        ? `${lead.studentFirstName} ${lead.studentLastName}`
                        : `${lead.parentFirstName} ${lead.parentLastName}`}
                    </h2>
                    <StageBadge stage={lead.stage} />
                  </div>
                  <p className="text-sm text-emerald-200/80">{lead.parentEmail}</p>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-emerald-200/70 md:grid-cols-2">
                {lead.programmeInterest ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/70">Interest</p>
                    <p className="font-medium text-emerald-100">{lead.programmeInterest}</p>
                  </div>
                ) : null}
                {lead.branch ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/70">Branch</p>
                    <p className="font-medium text-emerald-100">{lead.branch.name}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-300/70">Created</p>
                  <p className="font-medium text-emerald-100">{createdDate}</p>
                </div>
                {lead.tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs uppercase tracking-wide text-emerald-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-72">
              {latestContact ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/50 p-4">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-300/70">
                    <span className="flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                      Last contact
                    </span>
                    <span>{dateFormatter.format(new Date(latestContact.occurredAt))}</span>
                  </div>
                  <div className="mt-3 flex items-start gap-3 text-sm text-emerald-100/80">
                    <ContactChannelBadge channel={latestContact.channel} />
                    <p className="leading-5">{latestContact.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-900/40 p-4 text-xs uppercase tracking-wide text-emerald-300/60">
                  No contact logged yet
                </div>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                onClick={() => handleOpenDrawer(lead)}
              >
                View details
              </button>
            </div>
          </div>
        </li>
      );
    });
  }, [handleOpenDrawer, leads]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-950 to-emerald-900 text-emerald-50">
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Admissions</p>
            <div>
              <h1 className="text-4xl font-semibold text-white">Leads overview</h1>
              <p className="mt-2 max-w-2xl text-base text-emerald-100/70">
                Track enquiries across the admissions pipeline, spot momentum, and act on the right leads at the right time.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-emerald-500/40 transition hover:scale-[1.02] hover:shadow-lg"
            onClick={handleOpenCreateDrawer}
          >
            <PlusCircle className="h-4 w-4" aria-hidden /> New lead
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-900/50 p-5 shadow-inner shadow-emerald-950/40">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-300/80">
              Total leads
              <Users className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{total}</p>
            <p className="mt-2 text-sm text-emerald-200/70">Across all filters</p>
          </div>
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-900/50 p-5 shadow-inner shadow-emerald-950/40">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-300/80">
              Active filters
              <Filter className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{activeFilterChips.length}</p>
            <p className="mt-2 text-sm text-emerald-200/70">Individual filters applied</p>
          </div>
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-900/50 p-5 shadow-inner shadow-emerald-950/40">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-emerald-300/80">
              Awaiting contact
              <CalendarClock className="h-4 w-4" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{leads.filter((lead) => lead.contacts.length === 0).length}</p>
            <p className="mt-2 text-sm text-emerald-200/70">No touchpoints logged</p>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-500/30 bg-emerald-900/40 p-6 shadow-lg shadow-emerald-950/50">
          <header className="mb-6 flex flex-col gap-3 border-b border-emerald-800/40 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Filters</h2>
              <p className="text-sm text-emerald-200/70">Focus your pipeline by segment, owner, or stage.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SavedViewsMenu
                views={savedViews}
                loading={savedViewsLoading}
                saving={savedViewsSaving}
                activeViewId={activeSavedViewId}
                onRefresh={() => void loadSavedViews()}
                onSaveCurrent={saveCurrentFilters}
                onApply={applySavedView}
                onSetDefault={setDefaultView}
                onRename={renameSavedView}
                onDelete={deleteSavedView}
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-800/50"
                onClick={resetAllFilters}
              >
                Reset filters
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50 transition hover:bg-emerald-500/30"
                onClick={handleManualRefresh}
              >
                Refresh results
              </button>
            </div>
          </header>

          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/60" aria-hidden />
                <input
                  id="lead-search"
                  type="search"
                  placeholder="Search parents, students, notes, tags"
                  className="w-full rounded-full border border-emerald-500/30 bg-emerald-950/60 py-3 pl-11 pr-4 text-sm text-emerald-50 placeholder:text-emerald-200/50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  value={filters.search}
                  onChange={(event) => handleFilterChange({ search: event.target.value })}
                />
              </div>
            </div>

            {activeFilterChips.length ? (
              <div className="flex flex-wrap items-center gap-2" role="list">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500/25"
                    onClick={chip.remove}
                    role="listitem"
                  >
                    {chip.label}
                    <X className="h-3 w-3 transition group-hover:scale-110" aria-hidden />
                  </button>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-200/80 transition hover:bg-emerald-800/40"
                  onClick={resetAllFilters}
                >
                  Clear all
                </button>
              </div>
            ) : (
              <p className="text-xs uppercase tracking-wide text-emerald-300/70">No filters applied.</p>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              {renderFilterSection(
                'segmentation',
                'Segmentation',
                'Slice leads by branch or tagged metadata.',
                <div className="space-y-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/70">Branches</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableBranches.length ? (
                        availableBranches.map((branch) => {
                          const selected = filters.branchIds.includes(branch.id);
                          return (
                            <button
                              key={branch.id}
                              type="button"
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                selected
                                  ? 'border-emerald-400/70 bg-emerald-500/30 text-emerald-50 shadow shadow-emerald-500/20'
                                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80 hover:border-emerald-400/40 hover:text-emerald-100'
                              }`}
                              onClick={() => handleBranchToggle(branch.id)}
                            >
                              {branch.name}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-xs text-emerald-300/60">No branches available yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/70">Tags</p>
                    <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                      {availableTags.length ? (
                        availableTags.map((tag) => {
                          const selected = filters.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                selected
                                  ? 'border-emerald-400/70 bg-emerald-500/25 text-emerald-50 shadow shadow-emerald-500/20'
                                  : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200/80 hover:border-emerald-400/40 hover:text-emerald-100'
                              }`}
                              onClick={() => handleTagToggle(tag)}
                            >
                              #{tag}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-xs text-emerald-300/60">No tags captured yet.</p>
                      )}
                    </div>
                  </div>
                </div>,
              )}

              {renderFilterSection(
                'pipeline',
                'Pipeline stage',
                'Track movement across admissions stages.',
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-300/70">Stages</p>
                  <div className="flex flex-wrap gap-2">
                    {STAGE_OPTIONS.map((stage) => (
                      <button
                        key={stage.value}
                        type="button"
                        className={`rounded-2xl border px-2 py-1 transition ${
                          filters.stages.includes(stage.value)
                            ? 'border-emerald-400/70 bg-emerald-500/20'
                            : 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-400/40'
                        }`}
                        onClick={() => handleStageToggle(stage.value)}
                      >
                        <StageBadge stage={stage.value} />
                      </button>
                    ))}
                  </div>
                </div>,
              )}

              {renderFilterSection(
                'ownership',
                'Ownership',
                'Highlight owners responsible for the next touchpoint.',
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-300/70">Assigned staff IDs</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.assignedStaffIds.map((staffId) => (
                      <button
                        key={staffId}
                        type="button"
                        className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-500/35"
                        onClick={() =>
                          handleFilterChange({
                            assignedStaffIds: filters.assignedStaffIds.filter((value) => value !== staffId),
                          })
                        }
                      >
                        {staffId}
                        <X className="h-3 w-3 transition group-hover:scale-110" aria-hidden />
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="Add staff ID"
                      className="min-w-[9rem] rounded-full border border-dashed border-emerald-400/40 bg-emerald-950/60 px-3 py-1.5 text-xs text-emerald-100 placeholder:text-emerald-300/60 focus:border-emerald-400 focus:outline-none"
                      value={ownerInput}
                      onChange={handleOwnerInputChange}
                      onBlur={handleOwnerInputBlur}
                      onKeyDown={handleOwnerInputKeyDown}
                      onPaste={handleOwnerPaste}
                    />
                  </div>
                  <p className="text-xs text-emerald-300/60">Press ⏎ to add multiple owners or paste comma-separated IDs.</p>
                </div>,
              )}
            </div>
          </div>
        </section>

        {selectedLeadIds.length ? (
          <section className="rounded-2xl border border-emerald-500/50 bg-emerald-900/50 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-emerald-100">
                  {selectedLeadIds.length} lead{selectedLeadIds.length === 1 ? '' : 's'} selected
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-200/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-emerald-500/70 bg-emerald-950 text-emerald-400 focus:ring-emerald-400"
                      checked={selectedLeadIds.length === leads.length && leads.length > 0}
                      onChange={(event) => handleToggleSelectAll(event.target.checked)}
                    />
                    Select page
                  </label>
                  <button
                    type="button"
                    className="rounded-xl border border-emerald-500/40 bg-emerald-800/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-700/40"
                    onClick={() => setSelectedLeadIds([])}
                  >
                    Clear selection
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">Update stage</h3>
                  <div className="mt-3 space-y-3">
                    <select
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                      value={bulkStage}
                      onChange={(event) => setBulkStage((event.target.value as AdmissionLeadStage) || '')}
                      disabled={bulkActionLoading}
                    >
                      <option value="">Select stage</option>
                      {STAGE_OPTIONS.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/60 focus:border-emerald-400 focus:outline-none"
                      placeholder="Reason (optional)"
                      rows={2}
                      value={bulkStageReason}
                      onChange={(event) => setBulkStageReason(event.target.value)}
                      disabled={bulkActionLoading}
                    />
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/60 focus:border-emerald-400 focus:outline-none"
                      placeholder="Assign staff ID (optional)"
                      value={bulkStageAssigneeId}
                      onChange={(event) => setBulkStageAssigneeId(event.target.value)}
                      disabled={bulkActionLoading}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-700/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-600/50 disabled:opacity-60"
                      onClick={handleBulkStageUpdate}
                      disabled={bulkActionLoading}
                    >
                      {bulkActionLoading ? 'Updating…' : 'Apply stage' }
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">Assign staff</h3>
                  <div className="mt-3 space-y-3">
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/60 focus:border-emerald-400 focus:outline-none"
                      placeholder="Staff member ID (blank to unassign)"
                      value={bulkAssignStaffId}
                      onChange={(event) => setBulkAssignStaffId(event.target.value)}
                      disabled={bulkActionLoading}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-700/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-600/50 disabled:opacity-60"
                      onClick={handleBulkAssignStaff}
                      disabled={bulkActionLoading}
                    >
                      {bulkActionLoading ? 'Assigning…' : 'Apply assignment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {loadError ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-900/60 p-6 text-sm text-emerald-100/70">
            {loadError}
            <button
              type="button"
              className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-800/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-700/40"
              onClick={() => {
                void loadLeads(buildListParams());
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <AdmissionsCardsSkeleton />
        ) : leaderboard ? (
          <section>
            <ul className="space-y-4" data-testid="admissions-lead-list">
              {leaderboard}
            </ul>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/50 p-10 text-center text-sm text-emerald-100/70">
            No admissions leads found. Adjust filters or check back later.
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-emerald-800/50 pt-6 text-sm text-emerald-200/70">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} leads
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-800/40 disabled:opacity-40"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-800/40 disabled:opacity-40"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      <AdmissionDrawer
        lead={drawerLead}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onLeadUpdated={handleLeadUpdated}
      />
      <CreateLeadDrawer open={createDrawerOpen} onClose={handleCloseCreateDrawer} onCreated={handleLeadCreated} />
    </div>
  );
}
