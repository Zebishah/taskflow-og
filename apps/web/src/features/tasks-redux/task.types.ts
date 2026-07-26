export type TaskPriority = "low" | "medium" | "high" | "urgent";

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
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  columnId: string;
  priority?: TaskPriority;
  assigneeMemberId?: string | null;
  dueAt?: string | null;
}

export interface TaskLocation {
  workspaceId: string;
  projectId: string;
}

export interface AuthenticatedTaskLocation extends TaskLocation {
  accessToken: string;
}

export interface CreateTaskArguments extends AuthenticatedTaskLocation {
  input: CreateTaskInput;
}
