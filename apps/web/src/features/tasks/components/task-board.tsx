import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";

import type { ProjectColumn } from "../../project-columns/project-column.types";
import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task } from "../task.types";
import { TaskColumn } from "./task-column";

interface TaskBoardProps {
  columns: ProjectColumn[];
  tasksByColumn: Record<string, Task[]>;
  projectKey: string;
  members: WorkspaceMember[];
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

interface ColumnDropData {
  type: "column";
  columnId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTaskDragData(value: unknown): value is TaskDragData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "task" &&
    isRecord(value.task) &&
    typeof value.task.id === "string" &&
    typeof value.task.columnId === "string"
  );
}

function isColumnDropData(value: unknown): value is ColumnDropData {
  if (!isRecord(value)) {
    return false;
  }

  return value.type === "column" && typeof value.columnId === "string";
}

function getDestinationColumnId(value: unknown): string | null {
  if (isColumnDropData(value)) {
    return value.columnId;
  }

  /*
   * The pointer may finish over a task card instead
   * of directly over its parent column.
   */
  if (isTaskDragData(value)) {
    return value.task.columnId;
  }

  return null;
}

export function TaskBoard({
  columns,
  tasksByColumn,
  projectKey,
  members,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onColumnChange,
}: TaskBoardProps): React.JSX.Element {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),

    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent): void {
    const data: unknown = event.active.data.current;

    setActiveTask(isTaskDragData(data) ? data.task : null);
  }

  function handleDragEnd(event: DragEndEvent): void {
    setActiveTask(null);

    if (isArchived || isUpdating) {
      return;
    }

    const draggedData: unknown = event.active.data.current;

    const dropTargetData: unknown = event.over?.data.current;

    if (!isTaskDragData(draggedData)) {
      return;
    }

    const destinationColumnId = getDestinationColumnId(dropTargetData);

    if (!destinationColumnId) {
      return;
    }

    const destinationExists = columns.some(
      (column) => column.id === destinationColumnId,
    );

    if (!destinationExists) {
      return;
    }

    if (draggedData.task.columnId === destinationColumnId) {
      return;
    }

    onColumnChange(draggedData.task, destinationColumnId);
  }

  if (columns.length === 0) {
    return (
      <div className="mt-6 rounded-[28px] border border-dashed border-violet-200 bg-gradient-to-br from-white to-violet-50/60 px-6 py-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-2xl text-violet-700">
          ◫
        </div>

        <h2 className="mt-5 text-lg font-semibold text-slate-950">
          No workflow columns
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Add at least one project column before creating and organizing tasks.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragCancel={() => {
        setActiveTask(null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-6 overflow-x-auto pb-5">
        <div
          className="grid min-w-max items-start gap-4"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(300px, 300px))`,
          }}
        >
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              columns={columns}
              tasks={tasksByColumn[column.id] ?? []}
              projectKey={projectKey}
              members={members}
              isArchived={isArchived}
              canDelete={canDelete}
              isUpdating={isUpdating}
              onEdit={onEdit}
              onDelete={onDelete}
              onColumnChange={onColumnChange}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask !== null && (
          <div className="w-[300px] rotate-2 rounded-[22px] border border-violet-200 bg-white p-4 shadow-2xl shadow-violet-300/40">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-lg bg-violet-50 px-2 py-1 font-mono text-[10px] font-bold text-violet-700">
                {projectKey}-{activeTask.taskNumber}
              </span>

              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">
                Moving
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-950">
              {activeTask.title}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
