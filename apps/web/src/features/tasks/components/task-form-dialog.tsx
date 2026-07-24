import { useRef, useState, type FormEvent } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./task-date-time-picker.css";

import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import { getWorkspaceErrorMessage } from "../../workspaces/workspace-api";
import type {
  Task,
  TaskFormValues,
  TaskPriority,
  TaskStatus,
} from "../task.types";
import {
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
} from "../task.types";
import { RichTextEditor } from "./rich-text-editor";

interface TaskFormDialogProps {
  task?: Task;
  members: WorkspaceMember[];
  isPending: boolean;
  error: unknown;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  title?: string;
  description?: string;
  dueAt?: string;
}

/*
 * Converts the UTC ISO date returned by the API into the
 * local format required by <input type="datetime-local">.
 *
 * Example:
 * API:   2026-07-31T12:00:00.000Z
 * Input: 2026-07-31T17:00
 *        when the browser is using UTC+5.
 */
interface LocalDueDateParts {
  date: string;
  time: string;
}

function toLocalDueDateParts(
  value: string | null | undefined,
): LocalDueDateParts {
  if (!value) {
    return {
      date: "",
      time: "",
    };
  }

  const dueDate = new Date(value);

  if (Number.isNaN(dueDate.getTime())) {
    return {
      date: "",
      time: "",
    };
  }

  const timezoneOffset = dueDate.getTimezoneOffset() * 60_000;

  const localValue = new Date(dueDate.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);

  return {
    date: localValue.slice(0, 10),
    time: localValue.slice(11, 16),
  };
}

export function TaskFormDialog({
  task,
  members,
  isPending,
  error,
  onSubmit,
  onClose,
}: TaskFormDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(task?.title ?? "");

  const [description, setDescription] = useState(task?.description ?? "");

  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");

  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "medium",
  );

  const [assigneeMemberId, setAssigneeMemberId] = useState(
    task?.assigneeMemberId ?? "",
  );

  const initialDueAt = toLocalDueDateParts(task?.dueAt);

  const [dueDate, setDueDate] = useState(initialDueAt.date);

  const [dueTime, setDueTime] = useState(initialDueAt.time);

  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = task !== undefined;

  const selectedDueAt =
    dueDate && dueTime ? new Date(`${dueDate}T${dueTime}`) : null;

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    const normalizedTitle = title.trim();

    if (normalizedTitle.length < 2) {
      nextErrors.title = "Title must contain at least 2 characters.";
    }

    if (normalizedTitle.length > 200) {
      nextErrors.title = "Title cannot exceed 200 characters.";
    }

    if (description.trim().length > 5000) {
      nextErrors.description = "Description cannot exceed 5,000 characters.";
    }

    if ((dueDate && !dueTime) || (!dueDate && dueTime)) {
      nextErrors.dueAt = "Select both a due date and a due time.";
    }

    if (dueDate && dueTime) {
      const selectedDueAt = new Date(`${dueDate}T${dueTime}`);

      if (Number.isNaN(selectedDueAt.getTime())) {
        nextErrors.dueAt = "Enter a valid due date and time.";
      }
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
        status,
        priority,

        assigneeMemberId: assigneeMemberId || null,

        /*
         * datetime-local gives local browser time.
         * Date converts it to UTC and toISOString()
         * creates the format expected by the API.
         */
        dueAt:
          dueDate && dueTime
            ? new Date(`${dueDate}T${dueTime}`).toISOString()
            : null,
      });
    } catch {
      // Mutation error is rendered below.
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
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <svg
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
          onSubmit={(event) => void handleSubmit(event)}
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

                if (errors.title) {
                  setErrors((current) => ({
                    ...current,
                    title: undefined,
                  }));
                }
              }}
              placeholder="For example: Build authentication page"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
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
              maxLength={5000}
              onChange={(nextDescription) => {
                setDescription(nextDescription);

                if (errors.description) {
                  setErrors((current) => ({
                    ...current,
                    description: undefined,
                  }));
                }
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
                htmlFor="task-status"
                className="text-sm font-semibold text-slate-800"
              >
                Status
              </label>

              <select
                id="task-status"
                value={status}
                disabled={isPending}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {taskStatuses.map((taskStatus) => (
                  <option key={taskStatus} value={taskStatus}>
                    {taskStatusLabels[taskStatus]}
                  </option>
                ))}
              </select>
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
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
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
                onChange={(event) => setAssigneeMemberId(event.target.value)}
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
            <div className="sm:col-span-2">
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
                  selected={selectedDueAt}
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
                    if (value) {
                      const nextDueAt = toLocalDueDateParts(
                        value.toISOString(),
                      );

                      setDueDate(nextDueAt.date);
                      setDueTime(nextDueAt.time);
                    } else {
                      setDueDate("");
                      setDueTime("");
                    }

                    if (errors.dueAt) {
                      setErrors((current) => ({
                        ...current,
                        dueAt: undefined,
                      }));
                    }
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
                  Uses your local timezone. The assignee will receive an email
                  reminder before this time.
                </p>

                {(dueDate || dueTime) && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setDueDate("");
                      setDueTime("");

                      setErrors((current) => ({
                        ...current,
                        dueAt: undefined,
                      }));
                    }}
                    className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-rose-600 disabled:opacity-50"
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
              disabled={isPending}
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
