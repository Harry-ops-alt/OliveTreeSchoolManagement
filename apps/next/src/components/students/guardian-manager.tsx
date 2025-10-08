'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import type { GuardianLinkInput, InlineGuardianInput } from '../../lib/api/students';
import type { StudentDetail } from '../../app/app/students/[studentId]/data';
import { updateStudent } from '../../lib/api/students';
import { useToastHelpers } from '../toast/toast-provider';

export type GuardianManagerProps = {
  studentId: string;
  guardians: StudentDetail['guardians'];
  onChange?: () => void;
};

type Mode = 'link-existing' | 'create-new';

type FormState = {
  mode: Mode;
  isPrimary: boolean;
  relationship: string;
  order: number | null;
  existingGuardianId: string;
  newGuardian: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    notes: string;
  };
};

const defaultFormState: FormState = {
  mode: 'link-existing',
  isPrimary: false,
  relationship: '',
  order: null,
  existingGuardianId: '',
  newGuardian: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    notes: '',
  },
};

function BuildCommandBar({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onAdd}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add guardian
      </button>
    </div>
  );
}

export function GuardianManager({ studentId, guardians, onChange }: GuardianManagerProps): JSX.Element {
  const toast = useToastHelpers();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(defaultFormState);

  const hasGuardians = guardians.length > 0;
  const primaryGuardian = guardians.find((guardian) => guardian.isPrimary);

  const orderedGuardians = useMemo(
    () =>
      guardians
        .slice()
        .sort((a, b) => {
          const orderA = a.contactOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.contactOrder ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        }),
    [guardians],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormState(defaultFormState);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setFormState(defaultFormState);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const { mode, existingGuardianId, isPrimary, relationship, order, newGuardian } = formState;

      if (mode === 'link-existing' && !existingGuardianId) {
        toast.error('Select an existing guardian to link.');
        return;
      }

      if (mode === 'create-new' && (!newGuardian.firstName.trim() || !newGuardian.lastName.trim())) {
        toast.error('New guardian requires at least first and last name.');
        return;
      }

      setIsSubmitting(true);

      try {
        const guardiansPayload: GuardianLinkInput[] | undefined =
          mode === 'link-existing'
            ? [
                {
                  guardianId: existingGuardianId,
                  relationship: relationship || undefined,
                  isPrimary,
                  order: order ?? undefined,
                },
              ]
            : undefined;

        const inlineGuardiansPayload: InlineGuardianInput[] | undefined =
          mode === 'create-new'
            ? [
                {
                  firstName: newGuardian.firstName,
                  lastName: newGuardian.lastName,
                  email: newGuardian.email || undefined,
                  phone: newGuardian.phone || undefined,
                  alternatePhone: newGuardian.alternatePhone || undefined,
                  addressLine1: newGuardian.addressLine1 || undefined,
                  addressLine2: newGuardian.addressLine2 || undefined,
                  city: newGuardian.city || undefined,
                  state: newGuardian.state || undefined,
                  postalCode: newGuardian.postalCode || undefined,
                  country: newGuardian.country || undefined,
                  notes: newGuardian.notes || undefined,
                  relationship: relationship || undefined,
                  isPrimary,
                  order: order ?? undefined,
                },
              ]
            : undefined;

        await updateStudent(studentId, {
          guardians: guardiansPayload,
          inlineGuardians: inlineGuardiansPayload,
        });

        toast.success('Guardian connection saved.');
        closeModal();
        router.refresh();
        onChange?.();
      } catch (error) {
        console.error('Guardian link failed', error);
        toast.error('Unable to link guardian. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeModal, formState, onChange, studentId, toast],
  );

  return (
    <div className="space-y-4">
      <BuildCommandBar onAdd={openModal} disabled={isModalOpen} />

      <div className="space-y-3">
        {hasGuardians ? (
          orderedGuardians.map((guardian) => {
            const guardianName = `${guardian.guardian?.firstName ?? ''} ${guardian.guardian?.lastName ?? ''}`.trim();
            return (
              <article
                key={guardian.id}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-sm text-emerald-100/80"
              >
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{guardianName || 'Unknown guardian'}</h3>
                    <p className="text-xs uppercase tracking-wide text-emerald-300/80">
                      {guardian.relationship ?? 'Guardian'} · Priority {guardian.contactOrder ?? '—'}
                    </p>
                  </div>
                  {guardian.isPrimary ? (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                      Primary
                    </span>
                  ) : null}
                </header>
                <dl className="mt-4 grid gap-3 text-xs text-emerald-100/70 md:grid-cols-2">
                  <div>
                    <span className="text-emerald-300/80">Email:</span> {guardian.guardian?.email ?? '—'}
                  </div>
                  <div>
                    <span className="text-emerald-300/80">Phone:</span> {guardian.guardian?.phone ?? '—'}
                  </div>
                </dl>
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-900/30 p-4 text-sm text-emerald-100/70">
            No guardians linked yet. Add a guardian to ensure emergency contacts are on file.
          </p>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur" role="dialog" aria-modal>
          <div className="w-full max-w-2xl rounded-3xl border border-emerald-500/30 bg-emerald-950/95 p-6 text-emerald-50 shadow-2xl" role="document">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white">Add or link guardian</h2>
                <p className="text-sm text-emerald-100/70">
                  Link an existing contact or create a new guardian profile for this student.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-emerald-500/40 p-1 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-sm">
                <div className="flex gap-4">
                  <label className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-900/50 px-3 py-2">
                    <input
                      type="radio"
                      name="mode"
                      value="link-existing"
                      checked={formState.mode === 'link-existing'}
                      onChange={() => setFormState((state) => ({ ...state, mode: 'link-existing' }))}
                    />
                    <span className="text-emerald-100">Link existing guardian</span>
                  </label>
                  <label className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-900/50 px-3 py-2">
                    <input
                      type="radio"
                      name="mode"
                      value="create-new"
                      checked={formState.mode === 'create-new'}
                      onChange={() => setFormState((state) => ({ ...state, mode: 'create-new' }))}
                    />
                    <span className="text-emerald-100">Create new guardian</span>
                  </label>
                </div>

                {formState.mode === 'link-existing' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Guardian ID</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                      value={formState.existingGuardianId}
                      onChange={(event) =>
                        setFormState((state) => ({ ...state, existingGuardianId: event.target.value }))
                      }
                      placeholder="Paste guardian ID"
                      required
                    />
                    <p className="text-xs text-emerald-200/70">
                      Future enhancement: search existing guardians. For now, paste a guardian ID.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">First name</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.firstName}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, firstName: event.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Last name</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.lastName}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, lastName: event.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Email</label>
                      <input
                        type="email"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.email}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, email: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Phone</label>
                      <input
                        type="tel"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.phone}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, phone: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Alternate phone</label>
                      <input
                        type="tel"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.alternatePhone}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, alternatePhone: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Address line 1</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.addressLine1}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, addressLine1: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Address line 2</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.addressLine2}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, addressLine2: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">City</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.city}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, city: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">State</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.state}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, state: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Postal code</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus;border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.postalCode}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, postalCode: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Country</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus;border-emerald-300 focus:outline-none"
                        value={formState.newGuardian.country}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, country: event.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Notes</label>
                      <textarea
                        className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                        rows={3}
                        value={formState.newGuardian.notes}
                        onChange={(event) =>
                          setFormState((state) => ({
                            ...state,
                            newGuardian: { ...state.newGuardian, notes: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formState.isPrimary}
                    onChange={(event) =>
                      setFormState((state) => ({ ...state, isPrimary: event.target.checked }))
                    }
                  />
                  <span className="text-emerald-100">Set as primary guardian</span>
                </label>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Relationship</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                    value={formState.relationship}
                    onChange={(event) =>
                      setFormState((state) => ({ ...state, relationship: event.target.value }))
                    }
                    placeholder="e.g. Mother, Father, Guardian"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Contact priority</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-emerald-500/40 bg-emerald-900/50 px-4 py-2 text-sm text-emerald-50 focus:border-emerald-300 focus:outline-none"
                    value={formState.order ?? ''}
                    min={1}
                    onChange={(event) =>
                      setFormState((state) => ({ ...state, order: event.target.valueAsNumber || null }))
                    }
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/40 px-4 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-200 hover:text-white disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}<span>Save guardian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
