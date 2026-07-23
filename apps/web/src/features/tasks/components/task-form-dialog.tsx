import { useRef, useState, type FormEvent } from "react";

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

function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
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

  const [dueAt, setDueAt] = useState(toDateInputValue(task?.dueAt));

  const [errors, setErrors] = useState<FormErrors>({});

  const isEditing = task !== undefined;

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

    if (dueAt && Number.isNaN(new Date(dueAt).getTime())) {
      nextErrors.dueAt = "Enter a valid due date.";
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
        dueAt: dueAt ? new Date(`${dueAt}T23:59:59.999`).toISOString() : null,
      });
    } catch {
      // Mutation errors are displayed below.
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
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
              <label
                htmlFor="task-due-at"
                className="text-sm font-semibold text-slate-800"
              >
                Due date{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>

              <input
                id="task-due-at"
                type="date"
                value={dueAt}
                disabled={isPending}
                onChange={(event) => setDueAt(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              {errors.dueAt && (
                <p className="mt-2 text-xs text-rose-600">{errors.dueAt}</p>
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
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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
