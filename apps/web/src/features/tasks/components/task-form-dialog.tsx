import { useRef, useState, type FormEvent } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import "./task-date-time-picker.css";

import type { ProjectColumn } from "../../project-columns/project-column.types";
import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import type { Task, TaskFormValues, TaskPriority } from "../task.types";
import { taskPriorities, taskPriorityLabels } from "../task.types";
import { RichTextEditor } from "./rich-text-editor";

interface TaskFormDialogProps {
  task?: Task;
  columns: ProjectColumn[];
  members: WorkspaceMember[];
  isPending: boolean;
  error: unknown;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  title?: string;
  description?: string;
  columnId?: string;
  dueAt?: string;
}

function getInitialColumnId(
  task: Task | undefined,
  columns: readonly ProjectColumn[],
): string {
  /*
   * When editing, preserve the task's current column
   * as long as that column still exists.
   */
  if (task && columns.some((column) => column.id === task.columnId)) {
    return task.columnId;
  }

  /*
   * For a new task, prefer the first active column.
   * If none exists, use backlog, then the first column.
   */
  const defaultColumn =
    columns.find((column) => column.kind === "active") ??
    columns.find((column) => column.kind === "backlog") ??
    columns[0];

  return defaultColumn?.id ?? "";
}

function parseDueAt(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function TaskFormDialog({
  task,
  columns,
  members,
  isPending,
  error,
  onSubmit,
  onClose,
}: TaskFormDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(task?.title ?? "");

  const [description, setDescription] = useState(task?.description ?? "");

  const [columnId, setColumnId] = useState(() =>
    getInitialColumnId(task, columns),
  );

  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium",
  );

  const [assigneeMemberId, setAssigneeMemberId] = useState(
    task?.assigneeMemberId ?? "",
  );

  /*
   * React DatePicker works directly with Date objects.
   * The browser displays this Date in the user's local
   * timezone. We convert it to UTC only when submitting.
   */
  const [dueAt, setDueAt] = useState<Date | null>(() =>
    parseDueAt(task?.dueAt),
  );

  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = task !== undefined;

  function clearFieldError(field: keyof FormErrors): void {
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }

      return {
        ...current,
        [field]: undefined,
      };
    });
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    const normalizedTitle = title.trim();

    if (normalizedTitle.length < 2) {
      nextErrors.title = "Title must contain at least 2 characters.";
    } else if (normalizedTitle.length > 200) {
      nextErrors.title = "Title cannot exceed 200 characters.";
    }

    if (description.trim().length > 5_000) {
      nextErrors.description = "Description cannot exceed 5,000 characters.";
    }

    const selectedColumnExists = columns.some(
      (column) => column.id === columnId,
    );

    if (!selectedColumnExists) {
      nextErrors.columnId = "Select a valid project column.";
    }

    if (dueAt !== null && Number.isNaN(dueAt.getTime())) {
      nextErrors.dueAt = "Enter a valid due date and time.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        columnId,
        priority,
        assigneeMemberId: assigneeMemberId || null,

        /*
         * React DatePicker returns local browser time.
         * toISOString converts that exact moment to UTC
         * for PostgreSQL and the backend.
         */
        dueAt: dueAt?.toISOString() ?? null,
      });
    } catch {
      /*
       * The mutation error is received through the
       * error prop and rendered below.
       */
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
        className="relative my-8 w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/60 bg-white shadow-[0_30px_100px_-30px_rgba(15,23,42,.7)]"
      >
        <div className="relative overflow-hidden bg-[#0a0c20] px-6 py-6 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-12 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                TaskFlow project
              </p>

              <h2
                id="task-dialog-title"
                className="mt-2 text-2xl font-semibold tracking-tight"
              >
                {isEditing ? "Edit task" : "Create a task"}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {isEditing
                  ? "Update task details, assignment and progress."
                  : "Turn the next piece of work into a clear, actionable task."}
              </p>
            </div>

            <button
              type="button"
              aria-label="Close task dialog"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-5 p-6 sm:p-8"
        >
          <div>
            <label
              htmlFor="task-title"
              className="text-sm font-semibold text-slate-800"
            >
              Task title
            </label>

            <input
              id="task-title"
              autoFocus
              value={title}
              disabled={isPending}
              onChange={(event) => {
                setTitle(event.target.value);

                clearFieldError("title");
              }}
              placeholder="For example: Build authentication page"
              className={[
                "mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none transition",
                "placeholder:text-slate-400 focus:bg-white focus:ring-4",
                "disabled:cursor-not-allowed disabled:opacity-60",
                errors.title
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-violet-400 focus:ring-violet-100",
              ].join(" ")}
            />

            {errors.title && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label
              id="task-description-label"
              className="text-sm font-semibold text-slate-800"
            >
              Description
            </label>

            <RichTextEditor
              id="task-description"
              value={description}
              disabled={isPending}
              error={errors.description}
              maxLength={5_000}
              onChange={(nextDescription) => {
                setDescription(nextDescription);

                clearFieldError("description");
              }}
            />

            {errors.description && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-column"
                className="text-sm font-semibold text-slate-800"
              >
                Column
              </label>

              <select
                id="task-column"
                value={columnId}
                disabled={isPending || columns.length === 0}
                onChange={(event) => {
                  setColumnId(event.target.value);

                  clearFieldError("columnId");
                }}
                className={[
                  "mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition",
                  "focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
                  errors.columnId
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : "border-slate-200 focus:border-violet-400 focus:ring-violet-100",
                ].join(" ")}
              >
                {columns.length === 0 && (
                  <option value="">No columns available</option>
                )}

                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                    {column.kind === "done" ? " · completes task" : ""}
                  </option>
                ))}
              </select>

              {errors.columnId && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {errors.columnId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="text-sm font-semibold text-slate-800"
              >
                Priority
              </label>

              <select
                id="task-priority"
                value={priority}
                disabled={isPending}
                onChange={(event) => {
                  setPriority(event.target.value as TaskPriority);
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {taskPriorities.map((taskPriority) => (
                  <option key={taskPriority} value={taskPriority}>
                    {taskPriorityLabels[taskPriority]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-assignee"
                className="text-sm font-semibold text-slate-800"
              >
                Assignee
              </label>

              <select
                id="task-assignee"
                value={assigneeMemberId}
                disabled={isPending}
                onChange={(event) => {
                  setAssigneeMemberId(event.target.value);
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Unassigned</option>

                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user.firstName} {member.user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="task-due-at"
                  className="text-sm font-semibold text-slate-800"
                >
                  Due date and time
                </label>

                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Optional
                </span>
              </div>

              <div className="relative mt-2">
                <DatePicker
                  id="task-due-at"
                  selected={dueAt}
                  disabled={isPending}
                  showTimeSelect
                  withPortal
                  shouldCloseOnSelect={false}
                  showPopperArrow={false}
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMM d, yyyy · h:mm aa"
                  placeholderText="Choose a date and time"
                  calendarClassName="task-date-time-calendar"
                  wrapperClassName="task-date-time-wrapper"
                  className={[
                    "task-date-time-input",
                    errors.dueAt ? "task-date-time-input-invalid" : "",
                  ].join(" ")}
                  onChange={(value: Date | null) => {
                    setDueAt(value);

                    clearFieldError("dueAt");
                  }}
                />

                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-500"
                >
                  <path d="M7 3v3m10-3v3M4 9h16" />

                  <rect x="4" y="5" width="16" height="16" rx="3" />

                  <path d="M12 13v4l2 1" />
                </svg>
              </div>

              <div className="mt-2 flex items-start justify-between gap-4">
                <p className="text-[11px] leading-4 text-slate-400">
                  Uses your local timezone. The assignee receives an email
                  reminder before this time.
                </p>

                {dueAt !== null && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setDueAt(null);
                      clearFieldError("dueAt");
                    }}
                    className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                )}
              </div>

              {errors.dueAt && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {errors.dueAt}
                </p>
              )}
            </div>
          </div>

          {error !== null && error !== undefined && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {getWorkspaceErrorMessage(error)}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || columns.length === 0}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              {isPending && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}

              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
