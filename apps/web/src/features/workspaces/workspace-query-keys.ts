export const workspaceQueryKeys = {
  all: ["workspaces"] as const,

  lists: () => [...workspaceQueryKeys.all, "list"] as const,

  list: () => [...workspaceQueryKeys.lists(), "mine"] as const,

  details: () => [...workspaceQueryKeys.all, "detail"] as const,

  detail: (workspaceId: string) =>
    [...workspaceQueryKeys.details(), workspaceId] as const,
};
