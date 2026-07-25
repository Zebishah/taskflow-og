import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";

import type { ProjectColumn } from "../../project-columns/project-column.types";
import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task } from "../task.types";
import { TaskCard } from "./task-card";

interface DraggableTaskCardProps {
  projectKey: string;
  task: Task;
  columns: ProjectColumn[];
  assignee?: WorkspaceMember;
  isArchived: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onColumnChange: (task: Task, columnId: string) => void;
}

interface TaskDragData {
  type: "task";
  task: Task;
}

export function DraggableTaskCard({
  projectKey,
  task,
  columns,
  assignee,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onColumnChange,
}: DraggableTaskCardProps): React.JSX.Element {
  const disabled = isArchived || isUpdating;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,

      data: {
        type: "task",
        task,
      } satisfies TaskDragData,

      disabled,
    });

  const style: CSSProperties = {
    transform:
      transform !== null ? CSS.Translate.toString(transform) : undefined,

    opacity: isDragging ? 0.35 : 1,

    /*
     * The original card remains visible underneath
     * the DragOverlay with reduced opacity.
     */
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-cy={`task-card-${task.id}`}
      className={[
        "relative transition-transform duration-200",
        isDragging ? "scale-[1.02]" : "",
      ].join(" ")}
    >
      <TaskCard
        projectKey={projectKey}
        task={task}
        columns={columns}
        assignee={assignee}
        isArchived={isArchived}
        canDelete={canDelete}
        isUpdating={isUpdating}
        onEdit={onEdit}
        onDelete={onDelete}
        onColumnChange={onColumnChange}
        dragHandle={
          <button
            type="button"
            aria-label={`Drag ${task.title}`}
            disabled={disabled}
            {...attributes}
            {...listeners}
            className={[
              "flex h-8 w-8 touch-none items-center justify-center",
              "rounded-xl border border-transparent text-slate-400",
              "transition-colors duration-150",
              "hover:border-violet-200 hover:bg-violet-50",
              "hover:text-violet-600",
              "active:cursor-grabbing",
              "disabled:cursor-not-allowed disabled:opacity-40",
              disabled ? "cursor-not-allowed" : "cursor-grab",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <circle cx="7" cy="5" r="1.2" />
              <circle cx="13" cy="5" r="1.2" />
              <circle cx="7" cy="10" r="1.2" />
              <circle cx="13" cy="10" r="1.2" />
              <circle cx="7" cy="15" r="1.2" />
              <circle cx="13" cy="15" r="1.2" />
            </svg>
          </button>
        }
      />
    </div>
  );
}
