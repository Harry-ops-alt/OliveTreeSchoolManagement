'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
  createClassroom,
  deleteClassroom,
  listClassrooms,
  updateClassroom,
} from '../../../../lib/api/branches';
import type { Branch, Classroom } from '../../../../lib/types/branches';
import { BranchForm, type BranchFormValues } from '../../../../components/branches/branch-form';
import { ClassroomForm, type ClassroomFormValues } from '../../../../components/branches/classroom-form';
import { useToastHelpers } from '../../../../components/toast/toast-provider';

function mapBranchToFormValues(branch: Branch): BranchFormValues {
  return {
    name: branch.name,
    addressLine1: branch.addressLine1 ?? '',
    addressLine2: branch.addressLine2 ?? '',
    city: branch.city ?? '',
    state: branch.state ?? '',
    postalCode: branch.postalCode ?? '',
    country: branch.country ?? '',
    timezone: branch.timezone ?? '',
    phone: branch.phone ?? '',
    email: branch.email ?? '',
    notes: branch.notes ?? '',
  };
}

function mapClassroomToFormValues(classroom: Classroom): ClassroomFormValues {
  return {
    name: classroom.name,
    capacity: classroom.capacity ?? undefined,
    location: classroom.location ?? '',
    notes: classroom.notes ?? '',
  };
}

interface BranchesSettingsClientProps {
  defaultBranchId?: string;
}

type BranchModalMode = 'create' | 'edit';
type BranchModalState = { mode: BranchModalMode; branch?: Branch } | null;
type ClassroomModalState =
  | { mode: 'create'; branch: Branch }
  | { mode: 'edit'; branch: Branch; classroom: Classroom }
  | null;

export function BranchesSettingsClient({ defaultBranchId }: BranchesSettingsClientProps): JSX.Element {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(defaultBranchId ?? null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [branchModal, setBranchModal] = useState<BranchModalState>(null);
  const [processingBranch, setProcessingBranch] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [classroomModal, setClassroomModal] = useState<ClassroomModalState>(null);
  const [processingClassroom, setProcessingClassroom] = useState(false);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  const refreshBranches = useCallback(async () => {
    setLoadingBranches(true);
    setBranchesError(null);
    try {
      const data = await listBranches();
      setBranches(data);
      if (!selectedBranchId && data.length > 0) {
        setSelectedBranchId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load branches', error);
      setBranchesError('Unable to load branches right now.');
      showErrorToast('Unable to load branches. Please try again.');
    } finally {
      setLoadingBranches(false);
    }
  }, [selectedBranchId, showErrorToast]);

  const refreshClassrooms = useCallback(
    async (branchId: string) => {
      setLoadingClassrooms(true);
      try {
        const data = await listClassrooms(branchId);
        setClassrooms(data);
      } catch (error) {
        console.error('Failed to load classrooms', error);
        showErrorToast('Unable to load classrooms for this branch.');
      } finally {
        setLoadingClassrooms(false);
      }
    },
    [showErrorToast],
  );

  useEffect(() => {
    void refreshBranches();
  }, [refreshBranches]);

  useEffect(() => {
    if (!selectedBranchId) {
      setClassrooms([]);
      return;
    }
    void refreshClassrooms(selectedBranchId);
  }, [selectedBranchId, refreshClassrooms]);

  const handleCreateBranch = useCallback(
    async (values: BranchFormValues) => {
      setProcessingBranch(true);
      try {
        const branch = await createBranch(values);
        showSuccessToast('Branch created successfully.', 'Branch created');
        setBranchModal(null);
        await refreshBranches();
        setSelectedBranchId(branch.id);
      } catch (error) {
        console.error('Failed to create branch', error);
        showErrorToast('Unable to create branch. Please try again.');
      } finally {
        setProcessingBranch(false);
      }
    },
    [refreshBranches, showErrorToast, showSuccessToast],
  );

  const handleUpdateBranch = useCallback(
    async (values: BranchFormValues) => {
      if (!selectedBranch) {
        return;
      }
      setProcessingBranch(true);
      try {
        await updateBranch(selectedBranch.id, values);
        showSuccessToast('Branch details updated.', 'Branch updated');
        setBranchModal(null);
        await refreshBranches();
      } catch (error) {
        console.error('Failed to update branch', error);
        showErrorToast('Unable to update branch. Please try again.');
      } finally {
        setProcessingBranch(false);
      }
    },
    [refreshBranches, selectedBranch, showErrorToast, showSuccessToast],
  );

  const handleDeleteBranch = useCallback(
    async (branch: Branch) => {
      if (!window.confirm(`Delete ${branch.name}? This cannot be undone.`)) {
        return;
      }
      try {
        await deleteBranch(branch.id);
        showSuccessToast('Branch removed.');
        await refreshBranches();
        if (selectedBranchId === branch.id) {
          setSelectedBranchId(null);
        }
      } catch (error) {
        console.error('Failed to delete branch', error);
        showErrorToast('Unable to delete branch. Please try again.');
      }
    },
    [refreshBranches, selectedBranchId, showErrorToast, showSuccessToast],
  );

  const handleCreateClassroom = useCallback(
    async (values: ClassroomFormValues) => {
      if (!selectedBranch) {
        return;
      }
      setProcessingClassroom(true);
      try {
        await createClassroom(selectedBranch.id, values);
        showSuccessToast('Classroom created.', 'Room created');
        setClassroomModal(null);
        await refreshClassrooms(selectedBranch.id);
      } catch (error) {
        console.error('Failed to create classroom', error);
        showErrorToast('Unable to create classroom. Please try again.');
      } finally {
        setProcessingClassroom(false);
      }
    },
    [refreshClassrooms, selectedBranch, showErrorToast, showSuccessToast],
  );

  const handleUpdateClassroom = useCallback(
    async (values: ClassroomFormValues, classroom: Classroom) => {
      if (!selectedBranch) {
        return;
      }
      setProcessingClassroom(true);
      try {
        await updateClassroom(selectedBranch.id, classroom.id, values);
        showSuccessToast('Classroom updated.', 'Room updated');
        setClassroomModal(null);
        await refreshClassrooms(selectedBranch.id);
      } catch (error) {
        console.error('Failed to update classroom', error);
        showErrorToast('Unable to update classroom. Please try again.');
      } finally {
        setProcessingClassroom(false);
      }
    },
    [refreshClassrooms, selectedBranch, showErrorToast, showSuccessToast],
  );

  const handleDeleteClassroom = useCallback(
    async (classroom: Classroom) => {
      if (!selectedBranch) {
        return;
      }
      if (!window.confirm(`Delete ${classroom.name}? This cannot be undone.`)) {
        return;
      }
      try {
        await deleteClassroom(selectedBranch.id, classroom.id);
        showSuccessToast('Classroom removed.');
        await refreshClassrooms(selectedBranch.id);
      } catch (error) {
        console.error('Failed to delete classroom', error);
        showErrorToast('Unable to delete classroom. Please try again.');
      }
    },
    [refreshClassrooms, selectedBranch, showErrorToast, showSuccessToast],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">Settings</p>
        <h1 className="text-3xl font-semibold text-white">Branches & Rooms</h1>
        <p className="max-w-2xl text-sm text-emerald-100/70">
          Manage branch locations, contact details, and classroom capacity to power rostering, attendance, and
          financial reporting.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Branches</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
            onClick={() => setBranchModal({ mode: 'create' })}
          >
            <Plus className="h-4 w-4" aria-hidden /> Add branch
          </button>
        </div>

        {loadingBranches ? (
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-8 text-center text-sm text-emerald-100/70">
            Loading branches…
          </div>
        ) : branchesError ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-6 text-sm text-red-100/80">
            {branchesError}
          </div>
        ) : branches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/40 p-10 text-center text-sm text-emerald-100/70">
            No branches yet. Create your first branch to begin configuring timetables and classrooms.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <aside className="space-y-2">
              {branches.map((branch) => {
                const isActive = branch.id === selectedBranchId;
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => {
                      setSelectedBranchId(branch.id);
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                      isActive
                        ? 'border-emerald-500/60 bg-emerald-500/20 text-white'
                        : 'border-emerald-700/40 bg-emerald-950/60 text-emerald-100/80 hover:border-emerald-600/50 hover:bg-emerald-900/40'
                    }`}
                  >
                    <p className="font-semibold">{branch.name}</p>
                    <p className="text-xs text-emerald-100/60">
                      {[branch.city, branch.country].filter(Boolean).join(', ') || 'Location pending'}
                    </p>
                  </button>
                );
              })}
            </aside>

            <div className="space-y-6">
              {selectedBranch ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedBranch.name}</h3>
                      <p className="text-sm text-emerald-100/70">
                        {[
                          selectedBranch.addressLine1,
                          selectedBranch.addressLine2,
                          selectedBranch.city,
                          selectedBranch.state,
                          selectedBranch.postalCode,
                          selectedBranch.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Address not provided yet.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
                        onClick={() => setBranchModal({ mode: 'edit', branch: selectedBranch })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-100 transition hover:bg-red-500/20"
                        onClick={() => handleDeleteBranch(selectedBranch)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-6">
                    <h4 className="text-base font-semibold text-white">Contact & metadata</h4>
                    <dl className="mt-4 grid gap-3 text-sm text-emerald-100/80 md:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Timezone</dt>
                        <dd>{selectedBranch.timezone || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Phone</dt>
                        <dd>{selectedBranch.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Email</dt>
                        <dd>{selectedBranch.email || '—'}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Notes</dt>
                        <dd className="whitespace-pre-wrap text-emerald-100/80">
                          {selectedBranch.notes?.trim() || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-white">Classrooms</h4>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
                        onClick={() => setClassroomModal({ mode: 'create', branch: selectedBranch })}
                      >
                        <Plus className="h-4 w-4" aria-hidden /> Add room
                      </button>
                    </div>

                    {loadingClassrooms ? (
                      <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/60 p-6 text-sm text-emerald-100/70">
                        Loading rooms…
                      </div>
                    ) : classrooms.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-900/40 p-6 text-sm text-emerald-100/70">
                        No rooms yet. Add your first classroom for this branch.
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-emerald-700/40">
                        <table className="min-w-full divide-y divide-emerald-800/40 bg-emerald-950/70 text-sm text-emerald-100">
                          <thead className="bg-emerald-900/60 text-xs uppercase tracking-wide text-emerald-200/80">
                            <tr>
                              <th className="px-4 py-3 text-left">Name</th>
                              <th className="px-4 py-3 text-left">Capacity</th>
                              <th className="px-4 py-3 text-left">Location</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-800/40">
                            {classrooms.map((classroom) => (
                              <tr key={classroom.id} className="transition hover:bg-emerald-900/40">
                                <td className="px-4 py-3 font-medium text-white">{classroom.name}</td>
                                <td className="px-4 py-3">{classroom.capacity ?? '—'}</td>
                                <td className="px-4 py-3">{classroom.location || '—'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-wide">
                                    <button
                                      type="button"
                                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-emerald-100 transition hover:bg-emerald-500/30"
                                      onClick={() =>
                                        setClassroomModal({ mode: 'edit', branch: selectedBranch, classroom })
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-red-100 transition hover:bg-red-500/20"
                                      onClick={() => handleDeleteClassroom(classroom)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/40 p-10 text-center text-sm text-emerald-100/70">
                  Select a branch to view details and manage rooms.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {branchModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-3xl">
            <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/90 p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {branchModal.mode === 'create' ? 'Create branch' : 'Edit branch'}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-100/70">
                    {branchModal.mode === 'create'
                      ? 'Add a new branch location to manage students, staff, and classes.'
                      : 'Update branch information and contact details.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/40 bg-emerald-800/30 px-3 py-1 text-sm text-emerald-100"
                  onClick={() => setBranchModal(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-6">
                <BranchForm
                  initialValues={branchModal.branch ? mapBranchToFormValues(branchModal.branch) : undefined}
                  onSubmit={branchModal.mode === 'create' ? handleCreateBranch : handleUpdateBranch}
                  onCancel={() => setBranchModal(null)}
                  isSubmitting={processingBranch}
                  submitLabel={branchModal.mode === 'create' ? 'Create branch' : 'Save changes'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {classroomModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/90 p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {classroomModal.mode === 'create' ? 'Add classroom' : 'Edit classroom'}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-100/70">
                    Manage classroom capacity and location to support scheduling.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/40 bg-emerald-800/30 px-3 py-1 text-sm text-emerald-100"
                  onClick={() => setClassroomModal(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-6">
                <ClassroomForm
                  initialValues={
                    classroomModal.mode === 'edit' ? mapClassroomToFormValues(classroomModal.classroom) : undefined
                  }
                  onSubmit={(values) =>
                    classroomModal.mode === 'create'
                      ? handleCreateClassroom(values)
                      : classroomModal.classroom
                      ? handleUpdateClassroom(values, classroomModal.classroom)
                      : undefined
                  }
                  onCancel={() => setClassroomModal(null)}
                  isSubmitting={processingClassroom}
                  submitLabel={classroomModal.mode === 'create' ? 'Create classroom' : 'Save changes'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
