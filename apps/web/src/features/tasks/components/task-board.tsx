import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";

import type { WorkspaceMember } from "../../workspace-collaboration/workspace-collaboration.types";
import type { Task, TaskStatus } from "../task.types";
import { taskStatuses } from "../task.types";
import { TaskColumn } from "./task-column";

interface TaskBoardProps {
  tasksByStatus: Record<TaskStatus, Task[]>;
  projectKey: string;
  members: WorkspaceMember[];
  isArchived: boolean;
  canDelete: boolean;
  isUpdating: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

interface TaskDragData {
  type: "task";
  task: Task;
}

interface ColumnDropData {
  type: "column";
  status: TaskStatus;
}

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "task" &&
    "task" in value
  );
}

function isColumnDropData(value: unknown): value is ColumnDropData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "column" ||
    !("status" in value)
  ) {
    return false;
  }

  return taskStatuses.includes(value.status as TaskStatus);
}

export function TaskBoard({
  tasksByStatus,
  projectKey,
  members,
  isArchived,
  canDelete,
  isUpdating,
  onEdit,
  onDelete,
  onStatusChange,
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
    const data = event.active.data.current;

    setActiveTask(isTaskDragData(data) ? data.task : null);
  }

  function handleDragEnd(event: DragEndEvent): void {
    setActiveTask(null);

    const taskData = event.active.data.current;

    const columnData = event.over?.data.current;

    if (
      !isTaskDragData(taskData) ||
      !isColumnDropData(columnData) ||
      taskData.task.status === columnData.status
    ) {
      return;
    }

    onStatusChange(taskData.task, columnData.status);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveTask(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-6 overflow-x-auto pb-6">
        <div className="flex min-w-max items-start gap-5">
          {taskStatuses.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              projectKey={projectKey}
              members={members}
              isArchived={isArchived}
              canDelete={canDelete}
              isUpdating={isUpdating}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-[300px] rotate-2 rounded-[22px] border border-violet-200 bg-white p-4 shadow-2xl shadow-violet-300/40">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-lg bg-violet-50 px-2 py-1 font-mono text-[10px] font-bold text-violet-700">
                {projectKey}-{activeTask.taskNumber}
              </span>

              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
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
