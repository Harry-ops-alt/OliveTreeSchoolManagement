"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Search } from "lucide-react";
import { useToastHelpers } from "../../../components/toast/toast-provider";
import { listBranches } from "../../../lib/api/branches";
import { listClasses, createClass, updateClass, deleteClass } from "../../../lib/api/classes";
import type { Class, CreateClassInput, UpdateClassInput } from "../../../lib/types/classes";
import type { Branch } from "../../../lib/types/branches";

interface ClassesClientProps {
  orgId: string;
  defaultBranchId?: string;
}

type FormState =
  | { mode: "create" }
  | { mode: "edit"; classItem: Class }
  | null;

export function ClassesClient({ defaultBranchId }: ClassesClientProps): JSX.Element {
  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranchId, setFilterBranchId] = useState<string>(defaultBranchId ?? "");
  const [filterActive, setFilterActive] = useState<string>("true");
  
  const [formState, setFormState] = useState<FormState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [formBranchId, setFormBranchId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCapacity, setFormCapacity] = useState("0");
  const [formYearGroup, setFormYearGroup] = useState("");
  const [formActive, setFormActive] = useState(true);

  const refreshBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      const results = await listBranches();
      setBranches(results);
      if (!filterBranchId && results.length > 0) {
        setFilterBranchId(results[0].id);
      }
    } catch (error) {
      console.error("Failed to load branches", error);
      showErrorToast("Unable to load branches.");
    } finally {
      setLoadingBranches(false);
    }
  }, [filterBranchId, showErrorToast]);

  const refreshClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const response = await listClasses({
        q: searchQuery || undefined,
        branchId: filterBranchId || undefined,
        active: filterActive ? (filterActive === "true") : undefined,
        page,
        pageSize,
        order: "name:asc",
      });
      setClasses(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to load classes", error);
      showErrorToast("Unable to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  }, [filterBranchId, filterActive, page, pageSize, searchQuery, showErrorToast]);

  useEffect(() => {
    void refreshBranches();
  }, [refreshBranches]);

  useEffect(() => {
    void refreshClasses();
  }, [refreshClasses]);

  const openCreateForm = useCallback(() => {
    setFormState({ mode: "create" });
    setFormBranchId(filterBranchId || (branches[0]?.id ?? ""));
    setFormName("");
    setFormCode("");
    setFormCapacity("0");
    setFormYearGroup("");
    setFormActive(true);
  }, [branches, filterBranchId]);

  const openEditForm = useCallback((classItem: Class) => {
    setFormState({ mode: "edit", classItem });
    setFormBranchId(classItem.branchId);
    setFormName(classItem.name);
    setFormCode(classItem.code ?? "");
    setFormCapacity(String(classItem.capacity));
    setFormYearGroup(classItem.yearGroup ?? "");
    setFormActive(classItem.active);
  }, []);

  const closeForm = useCallback(() => {
    setFormState(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formBranchId || !formName) {
        showErrorToast("Branch and name are required.");
        return;
      }

      const capacity = parseInt(formCapacity, 10);
      if (isNaN(capacity) || capacity < 0) {
        showErrorToast("Capacity must be a non-negative number.");
        return;
      }

      setIsSubmitting(true);

      try {
        const payload: CreateClassInput | UpdateClassInput = {
          branchId: formBranchId,
          name: formName,
          code: formCode || null,
          capacity,
          yearGroup: formYearGroup || null,
          active: formActive,
        };

        if (!formState || formState.mode === "create") {
          await createClass(payload as CreateClassInput);
          showSuccessToast("Class created successfully.");
        } else {
          await updateClass(formState.classItem.id, payload);
          showSuccessToast("Class updated successfully.");
        }

        await refreshClasses();
        closeForm();
      } catch (error) {
        console.error("Failed to save class", error);
        showErrorToast("Unable to save class.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeForm, formActive, formBranchId, formCapacity, formCode, formName, formState, formYearGroup, refreshClasses, showErrorToast, showSuccessToast],
  );

  const handleDelete = useCallback(
    async (classItem: Class) => {
      const confirmed = window.confirm(`Delete ${classItem.name}? This cannot be undone.`);
      if (!confirmed) return;

      try {
        await deleteClass(classItem.id);
        showSuccessToast("Class deleted successfully.");
        await refreshClasses();
      } catch (error) {
        console.error("Failed to delete class", error);
        showErrorToast("Unable to delete class.");
      }
    },
    [refreshClasses, showErrorToast, showSuccessToast],
  );

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">School Information</p>
        <h1 className="text-3xl font-semibold text-white">Classes</h1>
        <p className="max-w-2xl text-sm text-emerald-100/70">
          Manage class cohorts, assign classrooms, and track capacity across branches.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/60" aria-hidden />
              <input
                type="text"
                placeholder="Search by name or code..."
                className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-emerald-300/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-emerald-200/70" htmlFor="branch-filter">
              Branch
            </label>
            <select
              id="branch-filter"
              className="min-w-[180px] rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
              value={filterBranchId}
              onChange={(e) => setFilterBranchId(e.target.value)}
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-emerald-200/70" htmlFor="active-filter">
              Status
            </label>
            <select
              id="active-filter"
              className="min-w-[140px] rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
          >
            <Plus className="h-4 w-4" aria-hidden /> New class
          </button>
        </div>

        {loadingClasses ? (
          <div className="flex items-center justify-center rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-200" aria-hidden />
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-8 text-center text-sm text-emerald-100/70">
            No classes found. Create one to get started.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-emerald-700/40 bg-emerald-950/60">
              <table className="w-full">
                <thead className="border-b border-emerald-700/40 bg-emerald-900/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                      Year Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                      Capacity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-emerald-200/70">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-700/20">
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="transition hover:bg-emerald-800/20">
                      <td className="px-4 py-3 text-sm text-white">{classItem.name}</td>
                      <td className="px-4 py-3 text-sm text-emerald-100/80">{classItem.code || "—"}</td>
                      <td className="px-4 py-3 text-sm text-emerald-100/80">{classItem.yearGroup || "—"}</td>
                      <td className="px-4 py-3 text-sm text-emerald-100/80">{classItem.capacity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            classItem.active
                              ? "bg-emerald-500/20 text-emerald-100"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {classItem.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-emerald-600/40 p-2 text-emerald-100 transition hover:bg-emerald-800/40"
                            onClick={() => openEditForm(classItem)}
                            aria-label="Edit class"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-500/40 p-2 text-red-200 transition hover:bg-red-500/10"
                            onClick={() => void handleDelete(classItem)}
                            aria-label="Delete class"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-100/70">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-emerald-600/40 px-3 py-1 text-sm text-emerald-100 transition hover:bg-emerald-800/40 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    className="rounded-lg border border-emerald-600/40 px-3 py-1 text-sm text-emerald-100 transition hover:bg-emerald-800/40 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {formState ? (
        <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/70 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {formState.mode === "create" ? "Create class" : "Edit class"}
              </h2>
              <p className="text-sm text-emerald-100/70">
                {formState.mode === "create"
                  ? "Add a new class cohort to your branch."
                  : "Update the class details."}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="form-branch" className="text-sm font-medium text-emerald-100">
                  Branch <span className="text-red-400">*</span>
                </label>
                <select
                  id="form-branch"
                  required
                  className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="form-name" className="text-sm font-medium text-emerald-100">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="form-name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Year 6 A"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-code" className="text-sm font-medium text-emerald-100">
                  Code
                </label>
                <input
                  id="form-code"
                  type="text"
                  className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. Y6A"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-capacity" className="text-sm font-medium text-emerald-100">
                  Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  id="form-capacity"
                  type="number"
                  required
                  min="0"
                  className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-year-group" className="text-sm font-medium text-emerald-100">
                  Year Group
                </label>
                <input
                  id="form-year-group"
                  type="text"
                  className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
                  value={formYearGroup}
                  onChange={(e) => setFormYearGroup(e.target.value)}
                  placeholder="e.g. Year 6"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-active" className="text-sm font-medium text-emerald-100">
                  Status
                </label>
                <select
                  id="form-active"
                  className="w-full rounded-xl border border-emerald-700/50 bg-emerald-950/50 px-4 py-2 text-sm text-white"
                  value={formActive ? "true" : "false"}
                  onChange={(e) => setFormActive(e.target.value === "true")}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-emerald-600/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-800/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving...
                  </>
                ) : (
                  <>{formState.mode === "create" ? "Create" : "Update"}</>
                )}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
