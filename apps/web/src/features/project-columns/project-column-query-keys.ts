export const projectColumnQueryKeys = {
  all: ["project-columns"] as const,

  list: (workspaceId: string, projectId: string) =>
    [...projectColumnQueryKeys.all, workspaceId, projectId] as const,
};
