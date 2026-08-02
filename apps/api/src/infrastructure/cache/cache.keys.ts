export const CacheKeys = {
  userWorkspaces: (userId: string): string => `tf:user:${userId}:workspaces`,

  membership: (workspaceId: string, userId: string): string =>
    `tf:ws:${workspaceId}:member:${userId}`,

  workspaceProjects: (workspaceId: string): string =>
    `tf:ws:${workspaceId}:projects`,

  workspaceMembers: (workspaceId: string): string =>
    `tf:ws:${workspaceId}:members`,

  projectColumns: (projectId: string): string =>
    `tf:project:${projectId}:columns`,

  projectTasks: (workspaceId: string, projectId: string): string =>
    `tf:project:${workspaceId}:${projectId}:tasks`,
} as const;
