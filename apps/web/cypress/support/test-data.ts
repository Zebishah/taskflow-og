export interface E2eUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface E2eWorkspace {
  name: string;
  slug: string;
  description: string;
}

export interface E2eProject {
  name: string;
  key: string;
  description: string;
}

export interface E2eTask {
  title: string;
  updatedTitle: string;
  description: string;
}

function uniqueSuffix(): string {
  return `${Date.now()}-` + Math.random().toString(36).slice(2, 10);
}

export function createE2eUser(prefix = "taskflow-e2e"): E2eUser {
  const suffix = uniqueSuffix();

  return {
    firstName: "Cypress",
    lastName: "Tester",
    email: `${prefix}-${suffix}` + "@example.com",
    password: "E2ePassword123!",
  };
}

export function createE2eWorkspace(): E2eWorkspace {
  const suffix = uniqueSuffix();

  return {
    name: `E2E Workspace ${suffix}`,
    slug: `e2e-workspace-${suffix}`,
    description: "Workspace created by Cypress E2E tests.",
  };
}

export function createE2eProject(): E2eProject {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

  return {
    name: `E2E Project ${suffix}`,

    /*
     * The backend permits a maximum of
     * ten characters.
     */
    key: `E${suffix}`.slice(0, 10),

    description: "Project created by Cypress E2E tests.",
  };
}

export function createE2eTask(): E2eTask {
  const suffix = uniqueSuffix();

  return {
    title: `Build E2E dashboard ${suffix}`,

    updatedTitle: `Build completed dashboard ${suffix}`,

    description: "Task created through the real browser workflow.",
  };
}
