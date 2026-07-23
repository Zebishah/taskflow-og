export interface Project {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  name: string;
  key: string;
  description: string | null;
  nextTaskNumber: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateProjectInput {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  key?: string;
  description?: string;
}

export type ProjectFilter = "active" | "archived" | "all";

export function isProjectArchived(project: Project): boolean {
  return project.archivedAt !== null;
}
