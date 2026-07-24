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

const statusDotClasses: Record<TaskStatus, string> = {
  backlog: "bg-slate-400",
  todo: "bg-blue-500",
  in_progress: "bg-violet-500",
  in_review: "bg-amber-500",
  done: "bg-emerald-500",
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

  return (
    <section
      ref={setNodeRef}
      data-cy={`task-column-${status}`}
      className={[
        "min-w-0 rounded-[26px] border p-3 transition duration-200",
        isOver
          ? "border-violet-400 bg-violet-100/80 shadow-xl shadow-violet-100"
          : "border-slate-200/80 bg-slate-100/70",
      ].join(" ")}
    >
      <header className="flex items-center justify-between gap-3 px-2 py-2">
        <div className="flex items-center gap-2">
          <span
            className={[
              "h-2.5 w-2.5 rounded-full",
              statusDotClasses[status],
            ].join(" ")}
          />

          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
            {taskStatusLabels[status]}
          </h2>
        </div>

        <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-white px-1.5 text-[10px] font-bold text-slate-500 shadow-sm">
          {tasks.length}
        </span>
      </header>

      <div className="mt-2 min-h-32 space-y-3">
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
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center">
            <p className="text-xs font-medium text-slate-400">
              Drop tasks here
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
