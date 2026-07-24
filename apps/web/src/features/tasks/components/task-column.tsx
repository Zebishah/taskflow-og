import { useDroppable } from "@dnd-kit/core";

import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskStatus } from "../task.types";
import { taskStatusLabels } from "../task.types";
import { DraggableTaskCard } from "./draggable-task-card";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  projectKey: string;
  members: WorkspaceMember[];
  isArchived: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

const statusStyles: Record<
  TaskStatus,
  {
    dot: string;
    background: string;
  }
> = {
  backlog: {
    dot: "bg-slate-400",
    background: "from-slate-50 to-slate-100/70",
  },

  todo: {
    dot: "bg-blue-500",
    background: "from-blue-50/70 to-slate-100/70",
  },

  in_progress: {
    dot: "bg-violet-500",
    background: "from-violet-50/70 to-slate-100/70",
  },

  in_review: {
    dot: "bg-amber-500",
    background: "from-amber-50/70 to-slate-100/70",
  },

  done: {
    dot: "bg-emerald-500",
    background: "from-emerald-50/70 to-slate-100/70",
  },
};

export function TaskColumn({
  status,
  tasks,
  projectKey,
  members,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskColumnProps): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: `task-column-${status}`,

    data: {
      type: "column",
      status,
    },
  });

  const style = statusStyles[status];

  return (
    <section
      ref={setNodeRef}
      data-cy={`task-column-${status}`}
      className={[
        "w-[300px] shrink-0 rounded-[28px] border bg-gradient-to-b p-3",
        "transition duration-200",
        style.background,
        isOver
          ? "border-violet-400 shadow-[0_20px_50px_-25px_rgba(124,58,237,.45)] ring-4 ring-violet-100"
          : "border-slate-200/80",
      ].join(" ")}
    >
      <header className="flex items-center justify-between gap-3 px-2 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={["h-2.5 w-2.5 rounded-full shadow-sm", style.dot].join(
              " ",
            )}
          />

          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-700">
            {taskStatusLabels[status]}
          </h2>
        </div>

        <span className="flex h-7 min-w-7 items-center justify-center rounded-xl border border-slate-200/70 bg-white px-2 text-[10px] font-bold text-slate-500 shadow-sm">
          {tasks.length}
        </span>
      </header>

      <div className="mt-1 min-h-40 space-y-3">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            projectKey={projectKey}
            task={task}
            assignee={members.find(
              (member) => member.id === task.assigneeMemberId,
            )}
            isArchived={isArchived}
            canDelete={canDelete}
            isUpdating={isUpdating}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className={[
              "flex min-h-36 items-center justify-center rounded-[22px]",
              "border-2 border-dashed px-5 text-center transition",
              isOver
                ? "border-violet-300 bg-violet-50 text-violet-600"
                : "border-slate-200 bg-white/45 text-slate-400",
            ].join(" ")}
          >
            <div>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="mx-auto h-6 w-6"
              >
                <path d="M12 4v16M4 12h16" />
              </svg>

              <p className="mt-2 text-xs font-semibold">Drop tasks here</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
