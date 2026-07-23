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
  onEdit: (task: Task) => void;
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

export function TaskCard({
  projectKey,
  task,
  assignee,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps): React.JSX.Element {
  const overdue = isOverdue(task);

  return (
    <article className="group rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/60">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] font-bold tracking-wider text-violet-600">
          {projectKey}-{task.taskNumber}
        </span>

        <TaskPriorityBadge priority={task.priority} />
      </div>

      <button
        type="button"
        onClick={() => onEdit(task)}
        className="mt-3 block w-full text-left"
      >
        <h3 className="text-sm font-semibold leading-6 text-slate-950 transition group-hover:text-violet-700">
          {task.title}
        </h3>

        {task.description && (
          <div className="mt-2 text-xs leading-5 text-slate-500">
            <RichTextContent value={task.description} compact />
          </div>
        )}
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {assignee ? (
          <div
            title={`${assignee.user.firstName} ${assignee.user.lastName}`}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-emerald-100 text-[10px] font-bold text-violet-700">
              {getInitials(assignee)}
            </span>

            <span className="max-w-24 truncate text-xs font-medium text-slate-600">
              {assignee.user.firstName}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}

        {task.dueAt && (
          <span
            className={[
              "ml-auto rounded-lg px-2 py-1 text-[10px] font-semibold",
              overdue
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {overdue ? "Overdue · " : ""}
            {formatDueDate(task.dueAt)}
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
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
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              Move to {taskStatusLabels[status].toLowerCase()}
            </option>
          ))}
        </select>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={isArchived}
            onClick={() => onEdit(task)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit
          </button>

          {canDelete && (
            <button
              type="button"
              disabled={isArchived || isUpdating}
              onClick={() => onDelete(task)}
              className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
