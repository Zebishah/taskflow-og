import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

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
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "type" in value && value.type === "task" && "task" in value;
}

function isColumnDropData(value: unknown): value is ColumnDropData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value) || value.type !== "column" || !("status" in value)) {
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),

    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const taskData = event.active.data.current;

    const columnData = event.over?.data.current;

    if (!isTaskDragData(taskData) || !isColumnDropData(columnData)) {
      return;
    }

    if (taskData.task.status === columnData.status) {
      return;
    }

    onStatusChange(taskData.task, columnData.status);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-6 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
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
    </DndContext>
  );
}
