import type { TaskPriority, TaskStatus } from "../task.types";
import { taskPriorityLabels, taskStatusLabels } from "../task.types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusClasses: Record<TaskStatus, string> = {
  backlog: "border-slate-200 bg-slate-100 text-slate-600",
  todo: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-violet-200 bg-violet-50 text-violet-700",
  in_review: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function TaskStatusBadge({
  status,
}: TaskStatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        statusClasses[status],
      ].join(" ")}
    >
      {taskStatusLabels[status]}
    </span>
  );
}

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const priorityClasses: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-rose-50 text-rose-700",
};

export function TaskPriorityBadge({
  priority,
}: TaskPriorityBadgeProps): React.JSX.Element {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        priorityClasses[priority],
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "h-1.5 w-1.5 rounded-full",
          priority === "urgent"
            ? "bg-rose-500"
            : priority === "high"
              ? "bg-orange-500"
              : priority === "medium"
                ? "bg-blue-500"
                : "bg-slate-400",
        ].join(" ")}
      />

      {taskPriorityLabels[priority]}
    </span>
  );
}
