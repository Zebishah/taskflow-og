export const projectColumnColors = [
  "slate",
  "blue",
  "violet",
  "amber",
  "emerald",
  "rose",
  "cyan",
  "indigo",
] as const;

export type ProjectColumnColor = (typeof projectColumnColors)[number];

export const projectColumnKinds = ["backlog", "active", "done"] as const;

export type ProjectColumnKind = (typeof projectColumnKinds)[number];

export interface ProjectColumn {
  id: string;
  projectId: string;
  name: string;
  color: ProjectColumnColor;
  kind: ProjectColumnKind;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectColumnInput {
  name: string;
  color: ProjectColumnColor;
  kind: ProjectColumnKind;
}

export type UpdateProjectColumnInput = Partial<CreateProjectColumnInput>;

export const projectColumnKindLabels: Record<ProjectColumnKind, string> = {
  backlog: "Backlog",
  active: "Active work",
  done: "Completes tasks",
};
