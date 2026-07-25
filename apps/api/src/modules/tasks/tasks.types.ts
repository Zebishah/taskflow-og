import type { TaskPriority } from '../../database/schema';

export interface CreateTaskRepositoryInput {
  workspaceId: string;
  projectId: string;
  createdByUserId: string;
  assigneeMemberId: string | null;
  columnId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueAt: Date | null;
  completedAt: Date | null;
}

export interface UpdateTaskRepositoryInput {
  title?: string;
  description?: string | null;
  columnId?: string;
  priority?: TaskPriority;
  assigneeMemberId?: string | null;
  dueAt?: Date | null;
  completedAt?: Date | null;
}

export interface TaskFilters {
  columnId?: string;
  priority?: TaskPriority;
  assigneeMemberId?: string;
  search?: string;
}
