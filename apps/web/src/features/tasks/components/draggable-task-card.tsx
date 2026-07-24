import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskStatus } from "../task.types";
import { TaskCard } from "./task-card";

interface DraggableTaskCardProps {
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

export function DraggableTaskCard({
  projectKey,
  task,
  assignee,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onStatusChange,
}: DraggableTaskCardProps): React.JSX.Element {
  const disabled = isArchived || isUpdating;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      disabled,

      data: {
        type: "task",
        task,
      },
    });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-cy={`task-card-${task.id}`}
      className={[
        "relative transition-[filter,opacity] duration-200",
        isDragging
          ? "scale-[1.025] rotate-[0.75deg] opacity-70 drop-shadow-2xl"
          : "opacity-100",
      ].join(" ")}
    >
      <TaskCard
        projectKey={projectKey}
        task={task}
        assignee={assignee}
        isArchived={isArchived}
        canDelete={canDelete}
        isUpdating={isUpdating}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        dragHandle={
          <button
            type="button"
            aria-label={`Drag ${task.title}`}
            disabled={disabled}
            {...attributes}
            {...listeners}
            className="
              flex h-7 w-7 cursor-grab
              touch-none items-center
              justify-center rounded-lg
              border border-transparent
              bg-slate-50 text-sm
              text-slate-400 transition duration-200
              hover:border-violet-300
              hover:bg-violet-50
              hover:text-violet-600
              hover:shadow-sm
              active:cursor-grabbing
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            ⠿
          </button>
        }
      />
    </div>
  );
}
