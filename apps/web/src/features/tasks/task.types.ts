export const taskStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ["low", "medium", "high", "urgent"] as const;

export type TaskPriority = (typeof taskPriorities)[number];
export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  columnId: string;
  createdByUserId: string;
  assigneeMemberId: string | null;
  taskNumber: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  position: number;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  imageKey: string | null;
  imageOriginalName: string | null;
  imageContentType: string | null;
  imageSizeBytes: number | null;
}
export interface CreateTaskInput {
  title: string;
  description?: string;
  columnId?: string;
  priority?: TaskPriority;
  assigneeMemberId?: string;
  dueAt?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  columnId?: string;
  priority?: TaskPriority;
  assigneeMemberId?: string | null;
  dueAt?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeMemberId?: string;
  search?: string;
  columnId?: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  columnId: string;
  priority: TaskPriority;
  assigneeMemberId: string | null;
  dueAt: string | null;
  imageFile: File | null;
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};
