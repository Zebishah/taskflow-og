import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskStatus } from "../task.types";
import { taskStatuses, taskStatusLabels } from "../task.types";
import { TaskPriorityBadge } from "./task-badges";
import { RichTextContent } from "./rich-text-editor";
import type { ReactNode } from "react";

interface TaskCardProps {
  projectKey: string;
  task: Task;
  assignee?: WorkspaceMember;
  isArchived: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onEdit: (task: Task) => void;
  dragHandle?: ReactNode;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isOverdue(task: Task): boolean {
  if (!task.dueAt || task.status === "done") {
    return false;
  }

  return new Date(task.dueAt).getTime() < Date.now();
}

function getInitials(member: WorkspaceMember): string {
  return (
    `${member.user.firstName[0] ?? ""}` + `${member.user.lastName[0] ?? ""}`
  ).toUpperCase();
}

const priorityAccentClasses: Record<Task["priority"], string> = {
  low: "from-slate-300 via-slate-200 to-transparent",
  medium: "from-blue-500 via-cyan-300 to-transparent",
  high: "from-orange-500 via-amber-300 to-transparent",
  urgent: "from-rose-500 via-pink-400 to-transparent",
};

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
  const overdue = isOverdue(task);

  return (
    <article className="task-card group relative isolate overflow-hidden rounded-[22px] border border-white/80 bg-white/95 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_12px_30px_rgba(99,102,241,0.05)] ring-1 ring-slate-200/70 transition-[box-shadow,border-color] duration-300 ease-out hover:border-violet-200/80 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08),0_18px_42px_rgba(124,58,237,0.1)]">
      <div
        aria-hidden="true"
        className={[
          "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r",
          priorityAccentClasses[task.priority],
        ].join(" ")}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 -z-10 h-36 w-36 rounded-full bg-violet-100/0 blur-3xl transition-colors duration-500 group-hover:bg-violet-100/70"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-violet-50 px-2 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-violet-700 ring-1 ring-violet-100">
          {projectKey}-{task.taskNumber}
        </span>

        <div className="flex items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          {dragHandle}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(task)}
        className="mt-3 block w-full rounded-lg text-left outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
      >
        <h3 className="text-[15px] font-bold leading-6 tracking-[-0.01em] text-slate-900 transition-colors duration-200 group-hover:text-violet-700">
          {task.title}
        </h3>

        {task.description && (
          <div className="mt-2 text-xs leading-5 text-slate-500">
            <RichTextContent value={task.description} compact />
          </div>
        )}
      </button>

      <div className="mt-4 flex min-h-8 items-center gap-2">
        {assignee ? (
          <div
            title={`${assignee.user.firstName} ${assignee.user.lastName}`}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-violet-200">
              {getInitials(assignee)}
            </span>

            <span className="max-w-20 truncate text-xs font-semibold text-slate-600">
              {assignee.user.firstName}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
              +
            </span>
            Unassigned
          </span>
        )}

        {task.dueAt && (
          <span
            className={[
              "ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold",
              overdue
                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                : "bg-slate-100/80 text-slate-500",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="h-3.5 w-3.5"
            >
              <path
                d="M5.5 2.5v2m9-2v2M3.5 7h13m-11 9.5h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {overdue ? "Overdue · " : ""}
            {formatDueDate(task.dueAt)}
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.1)]"
          />
          <select
            aria-label={`Status for ${task.title}`}
            value={task.status}
            disabled={isArchived || isUpdating}
            onChange={(event) => {
              const status = event.target.value as TaskStatus;

              if (status !== task.status) {
                onStatusChange(task, status);
              }
            }}
            className="w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/80 py-2.5 pl-8 pr-9 text-xs font-bold text-slate-700 outline-none transition duration-200 hover:border-violet-200 hover:bg-violet-50/70 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          >
            <path
              d="m6 8 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-label="Edit"
            title="Edit task"
            disabled={isArchived}
            onClick={() => onEdit(task)}
            className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-500 transition duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4"
            >
              <path
                d="m12.8 4.2 3 3M5.1 15.5l2.5-.5 7.7-7.7a1.4 1.4 0 0 0 0-2l-.6-.6a1.4 1.4 0 0 0-2 0L5 12.4l-.5 2.5c-.1.4.2.7.6.6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Edit</span>
          </button>

          {canDelete && (
            <button
              type="button"
              aria-label="Delete"
              title="Delete task"
              disabled={isArchived || isUpdating}
              onClick={() => onDelete(task)}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-bold text-slate-400 transition duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  d="M3.5 5.5h13m-8.5 3v5m4-5v5M5.5 5.5l.6 10a1 1 0 0 0 1 .9h5.8a1 1 0 0 0 1-.9l.6-10M8 5.5v-2h4v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
