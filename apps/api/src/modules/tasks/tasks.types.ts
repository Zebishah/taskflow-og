import type { TaskPriority, TaskStatus } from '../../database/schema';

export interface CreateTaskRepositoryInput {
  workspaceId: string;
  projectId: string;
  createdByUserId: string;
  assigneeMemberId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
}

export interface UpdateTaskRepositoryInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeMemberId?: string | null;
  dueAt?: Date | null;
  completedAt?: Date | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeMemberId?: string;
  search?: string;
}
