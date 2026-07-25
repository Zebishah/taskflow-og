import { useMemo, useState, type FormEvent } from "react";

import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import type { Task } from "../../tasks/task.types";
import {
  useCreateProjectColumnMutation,
  useDeleteProjectColumnMutation,
  useReorderProjectColumnsMutation,
  useUpdateProjectColumnMutation,
} from "../hooks/use-project-columns";
import type {
  ProjectColumn,
  ProjectColumnColor,
  ProjectColumnKind,
} from "../project-column.types";
import {
  projectColumnColors,
  projectColumnKindLabels,
  projectColumnKinds,
} from "../project-column.types";

interface WorkflowEditorDialogProps {
  workspaceId: string;
  projectId: string;
  columns: ProjectColumn[];
  tasks: Task[];
  onClose: () => void;
}

interface ColumnFormState {
  mode: "create" | "edit";
  columnId?: string;
  name: string;
  color: ProjectColumnColor;
  kind: ProjectColumnKind;
}

interface FormErrors {
  name?: string;
}

interface DeleteState {
  column: ProjectColumn;
  destinationColumnId: string;
}

interface ColorStyle {
  dot: string;
  selectedBorder: string;
  selectedBackground: string;
  text: string;
}

const colorStyles: Record<ProjectColumnColor, ColorStyle> = {
  slate: {
    dot: "bg-slate-400",
    selectedBorder: "border-slate-400",
    selectedBackground: "bg-slate-50",
    text: "Slate",
  },

  blue: {
    dot: "bg-blue-500",
    selectedBorder: "border-blue-400",
    selectedBackground: "bg-blue-50",
    text: "Blue",
  },

  violet: {
    dot: "bg-violet-500",
    selectedBorder: "border-violet-400",
    selectedBackground: "bg-violet-50",
    text: "Violet",
  },

  amber: {
    dot: "bg-amber-500",
    selectedBorder: "border-amber-400",
    selectedBackground: "bg-amber-50",
    text: "Amber",
  },

  emerald: {
    dot: "bg-emerald-500",
    selectedBorder: "border-emerald-400",
    selectedBackground: "bg-emerald-50",
    text: "Emerald",
  },

  rose: {
    dot: "bg-rose-500",
    selectedBorder: "border-rose-400",
    selectedBackground: "bg-rose-50",
    text: "Rose",
  },

  cyan: {
    dot: "bg-cyan-500",
    selectedBorder: "border-cyan-400",
    selectedBackground: "bg-cyan-50",
    text: "Cyan",
  },

  indigo: {
    dot: "bg-indigo-500",
    selectedBorder: "border-indigo-400",
    selectedBackground: "bg-indigo-50",
    text: "Indigo",
  },
};

const kindDescriptions: Record<ProjectColumnKind, string> = {
  backlog: "Work that has not entered the active workflow yet.",

  active: "Normal work that is currently planned or in progress.",

  done: "Moving a task here marks it as completed and cancels its reminder.",
};

function createEmptyForm(): ColumnFormState {
  return {
    mode: "create",
    name: "",
    color: "violet",
    kind: "active",
  };
}

function createEditForm(column: ProjectColumn): ColumnFormState {
  return {
    mode: "edit",
    columnId: column.id,
    name: column.name,
    color: column.color,
    kind: column.kind,
  };
}

export function WorkflowEditorDialog({
  workspaceId,
  projectId,
  columns,
  tasks,
  onClose,
}: WorkflowEditorDialogProps): React.JSX.Element {
  const [form, setForm] = useState<ColumnFormState | null>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

  const createMutation = useCreateProjectColumnMutation();

  const updateMutation = useUpdateProjectColumnMutation();

  const reorderMutation = useReorderProjectColumnsMutation();

  const deleteMutation = useDeleteProjectColumnMutation();

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const column of columns) {
      counts[column.id] = 0;
    }

    for (const task of tasks) {
      counts[task.columnId] = (counts[task.columnId] ?? 0) + 1;
    }

    return counts;
  }, [columns, tasks]);

  const doneColumnCount = columns.filter(
    (column) => column.kind === "done",
  ).length;

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    reorderMutation.isPending ||
    deleteMutation.isPending;

  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    reorderMutation.error ??
    deleteMutation.error;

  function resetMutationErrors(): void {
    createMutation.reset();
    updateMutation.reset();
    reorderMutation.reset();
    deleteMutation.reset();
  }

  function startCreating(): void {
    resetMutationErrors();
    setFormErrors({});
    setDeleteState(null);
    setForm(createEmptyForm());
  }

  function startEditing(column: ProjectColumn): void {
    resetMutationErrors();
    setFormErrors({});
    setDeleteState(null);
    setForm(createEditForm(column));
  }

  function closeForm(): void {
    if (isPending) {
      return;
    }

    setForm(null);
    setFormErrors({});
    resetMutationErrors();
  }

  function validateForm(): boolean {
    if (!form) {
      return false;
    }

    const normalizedName = form.name.trim();

    if (normalizedName.length === 0) {
      setFormErrors({
        name: "Column name is required.",
      });

      return false;
    }

    if (normalizedName.length > 50) {
      setFormErrors({
        name: "Column name cannot exceed 50 characters.",
      });

      return false;
    }

    const duplicate = columns.some(
      (column) =>
        column.id !== form.columnId &&
        column.name.trim().toLocaleLowerCase() ===
          normalizedName.toLocaleLowerCase(),
    );

    if (duplicate) {
      setFormErrors({
        name: "A column with this name already exists.",
      });

      return false;
    }

    setFormErrors({});

    return true;
  }

  async function submitForm(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form || !validateForm()) {
      return;
    }

    const input = {
      name: form.name.trim(),
      color: form.color,
      kind: form.kind,
    };

    try {
      if (form.mode === "create") {
        await createMutation.mutateAsync({
          workspaceId,
          projectId,
          input,
        });
      } else {
        if (!form.columnId) {
          return;
        }

        await updateMutation.mutateAsync({
          workspaceId,
          projectId,
          columnId: form.columnId,
          input,
        });
      }

      setForm(null);
      setFormErrors({});
    } catch {
      // The mutation error is displayed below.
    }
  }

  async function moveColumn(
    columnId: string,
    direction: "up" | "down",
  ): Promise<void> {
    const currentIndex = columns.findIndex((column) => column.id === columnId);

    if (currentIndex < 0) {
      return;
    }

    const destinationIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (destinationIndex < 0 || destinationIndex >= columns.length) {
      return;
    }

    const nextColumns = [...columns];

    const [movedColumn] = nextColumns.splice(currentIndex, 1);

    if (!movedColumn) {
      return;
    }

    nextColumns.splice(destinationIndex, 0, movedColumn);

    try {
      await reorderMutation.mutateAsync({
        workspaceId,
        projectId,
        columnIds: nextColumns.map((column) => column.id),
      });
    } catch {
      // Query state remains unchanged on failure.
    }
  }

  function getDeleteRestriction(column: ProjectColumn): string | null {
    if (columns.length <= 1) {
      return "The final project column cannot be deleted.";
    }

    if (column.kind === "done" && doneColumnCount <= 1) {
      return "Every project must keep at least one completion column.";
    }

    return null;
  }

  function startDeleting(column: ProjectColumn): void {
    const restriction = getDeleteRestriction(column);

    if (restriction) {
      return;
    }

    resetMutationErrors();
    setForm(null);
    setFormErrors({});

    const defaultDestination = columns.find(
      (candidate) => candidate.id !== column.id,
    );

    setDeleteState({
      column,
      destinationColumnId: defaultDestination?.id ?? "",
    });
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteState) {
      return;
    }

    const taskCount = taskCounts[deleteState.column.id] ?? 0;

    if (taskCount > 0 && !deleteState.destinationColumnId) {
      return;
    }

    try {
      const baseVariables = {
        workspaceId,
        projectId,
        columnId: deleteState.column.id,
      };

      if (taskCount > 0) {
        await deleteMutation.mutateAsync({
          ...baseVariables,
          moveTasksToColumnId: deleteState.destinationColumnId,
        });
      } else {
        await deleteMutation.mutateAsync(baseVariables);
      }

      setDeleteState(null);
    } catch {
      // The mutation error is displayed below.
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workflow-dialog-title"
        className="relative my-8 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-[0_35px_110px_-35px_rgba(15,23,42,.8)]"
      >
        <header className="relative overflow-hidden bg-[#090b1d] px-6 py-6 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-600/35 blur-[80px]" />

          <div className="pointer-events-none absolute -bottom-24 left-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-[80px]" />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Project workflow
              </p>

              <h2
                id="workflow-dialog-title"
                className="mt-2 text-2xl font-semibold tracking-tight"
              >
                Manage project columns
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Customize how tasks move through this project. Column changes
                only affect this project.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close workflow editor"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>
        </header>

        <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-950">
                  Workflow columns
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Use the arrows to control the order shown on the task board.
                </p>
              </div>

              <button
                type="button"
                disabled={isPending || columns.length >= 10}
                onClick={startCreating}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
              >
                <span className="text-base leading-none">+</span>
                Add column
              </button>
            </div>

            {columns.length >= 10 && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This project has reached the maximum of 10 columns.
              </p>
            )}

            <div className="mt-5 space-y-3">
              {columns.map((column, index) => {
                const taskCount = taskCounts[column.id] ?? 0;

                const deleteRestriction = getDeleteRestriction(column);

                return (
                  <article
                    key={column.id}
                    className="group rounded-[20px] border border-slate-200 bg-slate-50/70 p-3 transition hover:border-violet-200 hover:bg-white hover:shadow-lg hover:shadow-violet-100/60"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          "h-3 w-3 shrink-0 rounded-full shadow-sm",
                          colorStyles[column.color].dot,
                        ].join(" ")}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-semibold text-slate-900">
                            {column.name}
                          </h4>

                          <span
                            className={[
                              "rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em]",
                              column.kind === "done"
                                ? "bg-emerald-100 text-emerald-700"
                                : column.kind === "backlog"
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-violet-100 text-violet-700",
                            ].join(" ")}
                          >
                            {projectColumnKindLabels[column.kind]}
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {taskCount === 1 ? "1 task" : `${taskCount} tasks`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Move ${column.name} left`}
                          title="Move left"
                          disabled={isPending || index === 0}
                          onClick={() => {
                            void moveColumn(column.id, "up");
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          ←
                        </button>

                        <button
                          type="button"
                          aria-label={`Move ${column.name} right`}
                          title="Move right"
                          disabled={isPending || index === columns.length - 1}
                          onClick={() => {
                            void moveColumn(column.id, "down");
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          →
                        </button>

                        <button
                          type="button"
                          aria-label={`Edit ${column.name}`}
                          disabled={isPending}
                          onClick={() => {
                            startEditing(column);
                          }}
                          className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${column.name}`}
                          title={deleteRestriction ?? "Delete column"}
                          disabled={isPending || deleteRestriction !== null}
                          onClick={() => {
                            startDeleting(column);
                          }}
                          className="flex h-8 items-center justify-center rounded-lg border border-rose-100 bg-white px-2.5 text-[10px] font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {deleteRestriction && (
                      <p className="mt-2 border-t border-slate-200/70 pt-2 text-[10px] leading-4 text-amber-700">
                        {deleteRestriction}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0">
            {form ? (
              <form onSubmit={(event) => void submitForm(event)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-600">
                      {form.mode === "create" ? "New column" : "Edit column"}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-950">
                      {form.mode === "create"
                        ? "Add workflow step"
                        : "Update workflow step"}
                    </h3>
                  </div>

                  <button
                    type="button"
                    aria-label="Close column form"
                    disabled={isPending}
                    onClick={closeForm}
                    className="text-xl leading-none text-slate-400 transition hover:text-slate-700 disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="project-column-name"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Column name
                  </label>

                  <input
                    id="project-column-name"
                    autoFocus
                    value={form.name}
                    disabled={isPending}
                    maxLength={50}
                    placeholder="For example: Quality assurance"
                    onChange={(event) => {
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              name: event.target.value,
                            }
                          : current,
                      );

                      if (formErrors.name) {
                        setFormErrors({});
                      }
                    }}
                    className={[
                      "mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none transition focus:ring-4 disabled:opacity-50",
                      formErrors.name
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100",
                    ].join(" ")}
                  />

                  {formErrors.name && (
                    <p className="mt-2 text-xs font-medium text-rose-600">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <fieldset className="mt-5">
                  <legend className="text-xs font-semibold text-slate-700">
                    Color
                  </legend>

                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {projectColumnColors.map((color) => {
                      const selected = form.color === color;

                      const style = colorStyles[color];

                      return (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Use ${style.text} color`}
                          aria-pressed={selected}
                          disabled={isPending}
                          onClick={() => {
                            setForm((current) =>
                              current
                                ? {
                                    ...current,
                                    color,
                                  }
                                : current,
                            );
                          }}
                          className={[
                            "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-[9px] font-semibold transition",
                            selected
                              ? `${style.selectedBorder} ${style.selectedBackground} text-slate-800 ring-2 ring-violet-100`
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                          ].join(" ")}
                        >
                          <span
                            className={["h-3 w-3 rounded-full", style.dot].join(
                              " ",
                            )}
                          />

                          {style.text}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-5">
                  <legend className="text-xs font-semibold text-slate-700">
                    Behaviour
                  </legend>

                  <div className="mt-2 space-y-2">
                    {projectColumnKinds.map((kind) => (
                      <label
                        key={kind}
                        className={[
                          "block cursor-pointer rounded-xl border p-3 transition",
                          form.kind === kind
                            ? "border-violet-300 bg-violet-50"
                            : "border-slate-200 bg-white hover:border-violet-200",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="project-column-kind"
                            value={kind}
                            checked={form.kind === kind}
                            disabled={isPending}
                            onChange={() => {
                              setForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      kind,
                                    }
                                  : current,
                              );
                            }}
                            className="accent-violet-600"
                          />

                          <span className="text-xs font-semibold text-slate-800">
                            {projectColumnKindLabels[kind]}
                          </span>
                        </span>

                        <span className="mt-1.5 block pl-5 text-[10px] leading-4 text-slate-500">
                          {kindDescriptions[kind]}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {mutationError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
                  >
                    {getWorkspaceErrorMessage(mutationError)}
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={closeForm}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending && (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {form.mode === "create" ? "Add column" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-100 text-2xl">
                  ⚙
                </span>

                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  Select a column
                </h3>

                <p className="mt-2 max-w-60 text-xs leading-5 text-slate-500">
                  Edit an existing workflow step or add a new one for this
                  project.
                </p>

                <button
                  type="button"
                  disabled={isPending || columns.length >= 10}
                  onClick={startCreating}
                  className="mt-5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-40"
                >
                  Add a column
                </button>
              </div>
            )}

            {!form && mutationError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
              >
                {getWorkspaceErrorMessage(mutationError)}
              </div>
            )}
          </aside>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
          <p className="text-[10px] text-slate-400">
            {columns.length}/10 columns
          </p>

          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Done
          </button>
        </footer>

        {deleteState && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-column-title"
              className="w-full max-w-md rounded-[24px] border border-white/60 bg-white p-6 shadow-2xl"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-xl text-rose-600">
                !
              </span>

              <h3
                id="delete-column-title"
                className="mt-4 text-xl font-semibold text-slate-950"
              >
                Delete “{deleteState.column.name}”?
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This column will be permanently removed from the project
                workflow.
              </p>

              {(taskCounts[deleteState.column.id] ?? 0) > 0 && (
                <div className="mt-5">
                  <label
                    htmlFor="delete-column-destination"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Move {taskCounts[deleteState.column.id]} tasks to
                  </label>

                  <select
                    id="delete-column-destination"
                    value={deleteState.destinationColumnId}
                    disabled={isPending}
                    onChange={(event) => {
                      setDeleteState((current) =>
                        current
                          ? {
                              ...current,
                              destinationColumnId: event.target.value,
                            }
                          : current,
                      );
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  >
                    {columns
                      .filter((column) => column.id !== deleteState.column.id)
                      .map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {deleteMutation.error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
                >
                  {getWorkspaceErrorMessage(deleteMutation.error)}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setDeleteState(null);
                    deleteMutation.reset();
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep column
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    void confirmDelete();
                  }}
                  className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  Delete column
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
