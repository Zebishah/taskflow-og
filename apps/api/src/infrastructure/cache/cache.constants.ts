export const CACHE_REDIS = Symbol('CACHE_REDIS');

export const CACHE_TTL_SECONDS = {
  workspacesList: 60,
  membership: 60,
  projectsList: 60,
  membersList: 60,
  columnsList: 120,
  tasksList: 30,
} as const;
