"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useToastHelpers } from "../../../components/toast/toast-provider";
import { listBranches, listClassrooms, listTeacherProfiles } from "../../../lib/api/branches";
import { PageHeader } from "../../../components/ui/page-header";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
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

interface SchedulesClientProps {
  orgId: string;
  defaultBranchId?: string;
}

type FormState =
  | { mode: "create" }
  | { mode: "edit"; schedule: ClassSchedule }
  | null;

export function SchedulesClient({ defaultBranchId }: SchedulesClientProps): JSX.Element {
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
    <div className="space-y-6">
      <PageHeader
        title="Classes & Schedules"
        description="Manage recurring class slots, assign classrooms, and keep teaching staff aligned across each branch."
      />

      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="branch-select">
                Branch
              </label>
              <select
                id="branch-select"
                className="min-w-[220px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            <Button
              onClick={() => setFormState({ mode: "create" })}
              disabled={!selectedBranch}
            >
              <Plus className="h-4 w-4" aria-hidden /> New class
            </Button>
          </div>

          {loadingBranches ? (
            <div className="mt-4 p-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Loading branches…
            </div>
          ) : branchesError ? (
            <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-sm text-red-700 dark:text-red-400">{branchesError}</div>
          ) : null}
        </CardContent>
      </Card>

      {selectedBranch ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled classes</h2>
            {loadingSchedules ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden /> : null}
          </div>

          {schedulesError ? (
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <CardContent className="p-6 text-sm text-red-700 dark:text-red-400">
                {schedulesError}
              </CardContent>
            </Card>
          ) : schedules.length === 0 && !loadingSchedules ? (
            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-10 text-center text-sm text-gray-600 dark:text-gray-400">
                No classes scheduled for this branch yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {schedules.map((schedule) => (
                <Card
                  key={schedule.id}
                  className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
                >
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{schedule.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {schedule.dayOfWeek.charAt(0) + schedule.dayOfWeek.slice(1).toLowerCase()} · {renderScheduleTime(schedule)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setFormState({ mode: "edit", schedule })}
                          aria-label="Edit class"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-300 dark:border-red-700 p-2 text-red-700 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => void handleDelete(schedule)}
                          aria-label="Delete class"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Classroom</dt>
                        <dd className="text-gray-900 dark:text-white">{schedule.classroom?.name ?? "Unassigned"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Lead teacher</dt>
                        <dd className="text-gray-900 dark:text-white">
                          {schedule.teacherProfile?.user
                            ? `${schedule.teacherProfile.user.firstName ?? ""} ${schedule.teacherProfile.user.lastName ?? ""}`.trim() ||
                              schedule.teacherProfile.user.email ||
                              "Unnamed teacher"
                            : "Unassigned"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {formState ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formState.mode === "create" ? "Schedule a class" : "Edit class schedule"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formState.mode === "create"
                    ? "Define the lesson slot for this branch, including room and lead teacher."
                    : "Update the schedule details or change the assigned classroom/teacher."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={closeForm}
              >
                Close
              </Button>
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
