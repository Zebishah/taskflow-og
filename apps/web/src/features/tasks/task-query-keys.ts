import type { TaskFilters } from "./task.types";

export const taskQueryKeys = {
  all: ["tasks"] as const,

  project: (workspaceId: string, projectId: string) =>
    [...taskQueryKeys.all, workspaceId, projectId] as const,

  lists: (workspaceId: string, projectId: string) =>
    [...taskQueryKeys.project(workspaceId, projectId), "list"] as const,

  list: (workspaceId: string, projectId: string, filters: TaskFilters) =>
    [...taskQueryKeys.lists(workspaceId, projectId), filters] as const,

  details: (workspaceId: string, projectId: string) =>
    [...taskQueryKeys.project(workspaceId, projectId), "detail"] as const,

  detail: (workspaceId: string, projectId: string, taskId: string) =>
    [...taskQueryKeys.details(workspaceId, projectId), taskId] as const,
};
