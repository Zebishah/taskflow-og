import { useRef, type ReactNode } from "react";

import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskStatus } from "../task.types";
import { taskStatuses, taskStatusLabels } from "../task.types";
import { TaskPriorityBadge } from "./task-badges";
import { RichTextContent } from "./rich-text-editor";

interface TaskCardProps {
  projectKey: string;
  task: Task;
  assignee?: WorkspaceMember;
  isArchived: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  dragHandle?: ReactNode;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOverdueText(task: Task): string | null {
  if (!task.dueAt || task.status === "done") {
    return null;
  }

  const dueTime = new Date(task.dueAt).getTime();

  const difference = Date.now() - dueTime;

  if (difference <= 0) {
    return null;
  }

  const overdueMinutes = Math.ceil(difference / 60_000);

  if (overdueMinutes < 60) {
    return `Overdue by ${overdueMinutes}m`;
  }

  const overdueHours = Math.ceil(difference / (60 * 60_000));

  if (overdueHours < 24) {
    return `Overdue by ${overdueHours}h`;
  }

  const overdueDays = Math.ceil(difference / (24 * 60 * 60_000));

  return overdueDays === 1
    ? "Overdue by 1 day"
    : `Overdue by ${overdueDays} days`;
}

function getInitials(member: WorkspaceMember): string {
  return (
    `${member.user.firstName[0] ?? ""}` + `${member.user.lastName[0] ?? ""}`
  ).toUpperCase();
}

export function TaskCard({
  projectKey,
  task,
  assignee,
  isArchived,
  canDelete,
  isUpdating,
  dragHandle,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps): React.JSX.Element {
  const menuRef = useRef<HTMLDetailsElement>(null);

  const overdueText = getOverdueText(task);

  function closeMenu(): void {
    menuRef.current?.removeAttribute("open");
  }

  return (
    <article
      className={[
        "group relative rounded-[22px] border bg-white p-4",
        "shadow-[0_8px_24px_-18px_rgba(15,23,42,.45)]",
        "transition duration-200",
        "hover:-translate-y-0.5 hover:border-violet-200",
        "hover:shadow-[0_18px_38px_-20px_rgba(124,58,237,.35)]",
        overdueText ? "border-rose-200/90" : "border-slate-200/90",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-lg bg-violet-50 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-violet-700">
            {projectKey}-{task.taskNumber}
          </span>

          <TaskPriorityBadge priority={task.priority} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {dragHandle}

          <details ref={menuRef} className="group/menu relative">
            <summary
              aria-label={`Actions for ${task.title}`}
              className={[
                "flex h-8 w-8 cursor-pointer list-none items-center justify-center",
                "rounded-xl border border-transparent text-slate-400",
                "transition hover:border-slate-200 hover:bg-slate-50",
                "hover:text-slate-700",
                "[&::-webkit-details-marker]:hidden",
              ].join(" ")}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <circle cx="4" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="16" cy="10" r="1.5" />
              </svg>
            </summary>

            <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-300/60">
              <button
                type="button"
                disabled={isArchived}
                onClick={() => {
                  closeMenu();
                  onEdit(task);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path d="m13.5 3.5 3 3L7 16H4v-3L13.5 3.5Z" />
                </svg>
                Edit task
              </button>

              {!isArchived && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Move to
                  </p>

                  {taskStatuses
                    .filter((status) => status !== task.status)
                    .map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          closeMenu();

                          onStatusChange(task, status);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

                        {taskStatusLabels[status]}
                      </button>
                    ))}
                </>
              )}

              {canDelete && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    disabled={isArchived || isUpdating}
                    onClick={() => {
                      closeMenu();
                      onDelete(task);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path d="M4 6h12M8 3h4l1 3H7l1-3Zm-2 3 1 11h6l1-11M9 9v5m2-5v5" />
                    </svg>
                    Delete task
                  </button>
                </>
              )}
            </div>
          </details>
        </div>
      </div>

      <button
        type="button"
        disabled={isArchived}
        onClick={() => onEdit(task)}
        className="mt-4 block w-full text-left disabled:cursor-default"
      >
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 text-slate-950 transition group-hover:text-violet-700">
          {task.title}
        </h3>

        {task.description && (
          <div className="mt-2 max-h-[3.8rem] overflow-hidden text-xs leading-5 text-slate-500">
            <RichTextContent value={task.description} compact />
          </div>
        )}
      </button>

      <div className="mt-4 border-t border-slate-100 pt-3">
        {assignee ? (
          <div
            title={`${assignee.user.firstName} ${assignee.user.lastName}`}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white shadow-md shadow-violet-200">
              {getInitials(assignee)}
            </span>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Assignee
              </p>

              <p className="truncate text-xs font-semibold text-slate-700">
                {assignee.user.firstName} {assignee.user.lastName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-dashed border-slate-300">
              +
            </span>
            Unassigned
          </div>
        )}

        {task.dueAt && (
          <div
            className={[
              "mt-3 flex items-center gap-2 rounded-xl border px-3 py-2.5",
              overdueText
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0"
            >
              <path d="M6 2v3m8-3v3M3 8h14" />

              <rect x="3" y="4" width="14" height="13" rx="3" />
            </svg>

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                {overdueText ? overdueText : "Due date"}
              </p>

              <p className="truncate text-[11px] font-semibold">
                {formatDueDate(task.dueAt)}
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
