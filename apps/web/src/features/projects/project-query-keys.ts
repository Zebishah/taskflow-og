export const projectQueryKeys = {
  all: ["projects"] as const,

  lists: () => [...projectQueryKeys.all, "list"] as const,

  list: (workspaceId: string) =>
    [...projectQueryKeys.lists(), workspaceId] as const,

  details: () => [...projectQueryKeys.all, "detail"] as const,

  detail: (workspaceId: string, projectId: string) =>
    [...projectQueryKeys.details(), workspaceId, projectId] as const,
};
