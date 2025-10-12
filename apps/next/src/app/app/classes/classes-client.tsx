"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useToastHelpers } from "../../../components/toast/toast-provider";
import { listBranches, listClassrooms, listTeacherProfiles } from "../../../lib/api/branches";
import {
  ClassScheduleConflictError,
  createClassSchedule,
  deleteClassSchedule,
  listClassSchedules,
  updateClassSchedule,
} from "../../../lib/api/class-schedules";
import type { ClassSchedule, CreateClassScheduleInput } from "../../../lib/types/class-schedules";
import type { Branch, Classroom } from "../../../lib/types/branches";
import type { TeacherProfileSummary } from "../../../lib/types/class-schedules";
import {
  ClassScheduleForm,
  type ClassScheduleFormValues,
} from "../../../components/branches/class-schedule-form";

interface ClassesClientProps {
  orgId: string;
  defaultBranchId?: string;
}

type FormState =
  | { mode: "create" }
  | { mode: "edit"; schedule: ClassSchedule }
  | null;

export function ClassesClient({ defaultBranchId }: ClassesClientProps): JSX.Element {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(defaultBranchId ?? null);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfileSummary[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingTeacherProfiles, setLoadingTeacherProfiles] = useState(false);

  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  const [formState, setFormState] = useState<FormState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [conflictDetails, setConflictDetails] = useState<ClassScheduleConflictError["clashes"] | null>(null);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  const refreshBranches = useCallback(async () => {
    setLoadingBranches(true);
    setBranchesError(null);
    try {
      const results = await listBranches();
      setBranches(results);
      if (!selectedBranchId && results.length > 0) {
        setSelectedBranchId(results[0].id);
      }
    } catch (error) {
      console.error("Failed to load branches", error);
      setBranchesError("Unable to load branches right now.");
      showErrorToast("Unable to load branches.");
    } finally {
      setLoadingBranches(false);
    }
  }, [selectedBranchId, showErrorToast]);

  const refreshSchedules = useCallback(
    async (branchId: string) => {
      setLoadingSchedules(true);
      setSchedulesError(null);
      try {
        const data = await listClassSchedules(branchId);
        setSchedules(data);
      } catch (error) {
        console.error("Failed to load schedules", error);
        setSchedulesError("Unable to load class schedules for this branch.");
        showErrorToast("Unable to load class schedules.");
      } finally {
        setLoadingSchedules(false);
      }
    },
    [showErrorToast],
  );

  const refreshClassrooms = useCallback(
    async (branchId: string) => {
      setLoadingClassrooms(true);
      try {
        const rooms = await listClassrooms(branchId);
        setClassrooms(rooms);
      } catch (error) {
        console.error("Failed to load classrooms", error);
        showErrorToast("Unable to load classrooms.");
      } finally {
        setLoadingClassrooms(false);
      }
    },
    [showErrorToast],
  );

  const refreshTeacherProfiles = useCallback(
    async (branchId: string) => {
      setLoadingTeacherProfiles(true);
      try {
        const profiles = await listTeacherProfiles(branchId);
        setTeacherProfiles(profiles);
      } catch (error) {
        console.error("Failed to load teacher profiles", error);
        showErrorToast("Unable to load teacher profiles.");
      } finally {
        setLoadingTeacherProfiles(false);
      }
    },
    [showErrorToast],
  );

  useEffect(() => {
    void refreshBranches();
  }, [refreshBranches]);

  useEffect(() => {
    if (!selectedBranchId) {
      setSchedules([]);
      setClassrooms([]);
      setTeacherProfiles([]);
      return;
    }
    void refreshSchedules(selectedBranchId);
    void refreshClassrooms(selectedBranchId);
    void refreshTeacherProfiles(selectedBranchId);
  }, [selectedBranchId, refreshClassrooms, refreshSchedules, refreshTeacherProfiles]);

  const closeForm = useCallback(() => {
    setFormState(null);
    setConflictDetails(null);
    setConflictMessage(null);
  }, []);

  const mapScheduleToFormValues = useCallback((schedule: ClassSchedule): ClassScheduleFormValues => {
    const toTime = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "00:00";
      }
      return date.toISOString().slice(11, 16);
    };

    return {
      title: schedule.title,
      description: schedule.description ?? "",
      dayOfWeek: schedule.dayOfWeek,
      startTime: toTime(schedule.startTime),
      endTime: toTime(schedule.endTime),
      classroomId: schedule.classroomId ?? "",
      teacherProfileId: schedule.teacherProfileId ?? "",
    };
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateClassScheduleInput) => {
      if (!selectedBranchId) {
        return;
      }

      setIsSubmitting(true);
      setConflictDetails(null);
      setConflictMessage(null);

      try {
        if (!formState || formState.mode === "create") {
          await createClassSchedule(selectedBranchId, payload);
          showSuccessToast("Class schedule created.", "Schedule saved");
        } else {
          await updateClassSchedule(selectedBranchId, formState.schedule.id, payload);
          showSuccessToast("Class schedule updated.");
        }
        await refreshSchedules(selectedBranchId);
        closeForm();
      } catch (error) {
        if (error instanceof ClassScheduleConflictError) {
          setConflictDetails(error.clashes);
          setConflictMessage(error.message);
          showErrorToast(error.message);
          return;
        }
        console.error("Failed to save class schedule", error);
        showErrorToast("Unable to save class schedule.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeForm, formState, refreshSchedules, selectedBranchId, showErrorToast, showSuccessToast],
  );

  const handleDelete = useCallback(
    async (schedule: ClassSchedule) => {
      if (!selectedBranchId) {
        return;
      }
      const confirmed = window.confirm(`Delete ${schedule.title}? This cannot be undone.`);
      if (!confirmed) {
        return;
      }
      try {
        await deleteClassSchedule(selectedBranchId, schedule.id);
        showSuccessToast("Class schedule removed.");
        await refreshSchedules(selectedBranchId);
      } catch (error) {
        console.error("Failed to delete class schedule", error);
        showErrorToast("Unable to delete class schedule.");
      }
    },
    [refreshSchedules, selectedBranchId, showErrorToast, showSuccessToast],
  );

  const renderScheduleTime = (schedule: ClassSchedule) => {
    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);
    const format = (date: Date) =>
      Number.isNaN(date.getTime())
        ? "--:--"
        : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${format(start)} – ${format(end)}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">Timetable</p>
        <h1 className="text-3xl font-semibold text-white">Classes & Schedules</h1>
        <p className="max-w-2xl text-sm text-emerald-100/70">
          Manage recurring class slots, assign classrooms, and keep teaching staff aligned across each branch.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-emerald-200/70" htmlFor="branch-select">
              Branch
            </label>
            <select
              id="branch-select"
              className="min-w-[220px] rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
              value={selectedBranchId ?? ""}
              onChange={(event) => setSelectedBranchId(event.target.value || null)}
            >
              <option value="" disabled>
                {loadingBranches ? "Loading branches…" : "Select a branch"}
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFormState({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
            disabled={!selectedBranch}
          >
            <Plus className="h-4 w-4" aria-hidden /> New class
          </button>
        </div>

        {loadingBranches ? (
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-8 text-center text-sm text-emerald-100/70">
            Loading branches…
          </div>
        ) : branchesError ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-6 text-sm text-red-100/80">{branchesError}</div>
        ) : null}
      </section>

      {selectedBranch ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Scheduled classes</h2>
            {loadingSchedules ? <Loader2 className="h-4 w-4 animate-spin text-emerald-200" aria-hidden /> : null}
          </div>

          {schedulesError ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-950/40 p-6 text-sm text-red-100/80">
              {schedulesError}
            </div>
          ) : schedules.length === 0 && !loadingSchedules ? (
            <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-8 text-center text-sm text-emerald-100/70">
              No classes scheduled for this branch yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {schedules.map((schedule) => (
                <article
                  key={schedule.id}
                  className="space-y-3 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{schedule.title}</h3>
                      <p className="text-xs uppercase tracking-wide text-emerald-200/70">
                        {schedule.dayOfWeek.charAt(0) + schedule.dayOfWeek.slice(1).toLowerCase()} · {renderScheduleTime(schedule)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-600/40 p-2 text-emerald-100 transition hover:bg-emerald-800/40"
                        onClick={() => setFormState({ mode: "edit", schedule })}
                        aria-label="Edit class"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-500/40 p-2 text-red-200 transition hover:bg-red-500/10"
                        onClick={() => void handleDelete(schedule)}
                        aria-label="Delete class"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <dl className="space-y-1 text-sm text-emerald-100/80">
                    <div>
                      <dt className="text-emerald-200/70">Classroom</dt>
                      <dd>{schedule.classroom?.name ?? "Unassigned"}</dd>
                    </div>
                    <div>
                      <dt className="text-emerald-200/70">Lead teacher</dt>
                      <dd>
                        {schedule.teacherProfile?.user
                          ? `${schedule.teacherProfile.user.firstName ?? ""} ${schedule.teacherProfile.user.lastName ?? ""}`.trim() ||
                            schedule.teacherProfile.user.email ||
                            "Unnamed teacher"
                          : "Unassigned"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {formState ? (
        <section className="space-y-4 rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {formState.mode === "create" ? "Schedule a class" : "Edit class schedule"}
              </h2>
              <p className="text-sm text-emerald-100/70">
                {formState.mode === "create"
                  ? "Define the lesson slot for this branch, including room and lead teacher."
                  : "Update the schedule details or change the assigned classroom/teacher."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-emerald-600/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-800/40"
            >
              Close
            </button>
          </div>

          <ClassScheduleForm
            classrooms={classrooms}
            teacherProfiles={teacherProfiles}
            teacherProfilesLoading={loadingTeacherProfiles}
            initialValues={formState.mode === "edit" ? mapScheduleToFormValues(formState.schedule) : undefined}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            conflictDetails={conflictDetails ?? undefined}
            conflictMessage={conflictMessage}
          />
        </section>
      ) : null}
    </div>
  );
}
