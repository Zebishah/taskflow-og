import { taskflowApi } from "../../app/taskflow-api";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./project.types";

interface AuthenticatedRequest {
  accessToken: string;
}

interface WorkspaceProjectsRequest extends AuthenticatedRequest {
  workspaceId: string;
}

interface ProjectRequest extends WorkspaceProjectsRequest {
  projectId: string;
}

interface CreateProjectRequest extends WorkspaceProjectsRequest {
  input: CreateProjectInput;
}

interface UpdateProjectRequest extends ProjectRequest {
  input: UpdateProjectInput;
}

function createAuthorizationHeaders(
  accessToken: string,
): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

function getProjectListTagId(workspaceId: string): string {
  return `LIST-${workspaceId}`;
}

export const projectRtkApi = taskflowApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], WorkspaceProjectsRequest>({
      query: ({ workspaceId, accessToken }) => ({
        url: `/workspaces/${workspaceId}/projects`,
        method: "GET",
        headers: createAuthorizationHeaders(accessToken),
      }),

      /*
       * Every workspace receives an independent cache.
       *
       * projects:workspace-a-id
       * projects:workspace-b-id
       */
      serializeQueryArgs: ({ queryArgs }) =>
        `projects:${queryArgs.workspaceId}`,

      providesTags: (projects, _error, arguments_) => [
        {
          type: "Project",
          id: getProjectListTagId(arguments_.workspaceId),
        },

        ...(projects?.map((project) => ({
          type: "Project" as const,
          id: project.id,
        })) ?? []),
      ],
    }),

    getProject: builder.query<Project, ProjectRequest>({
      query: ({ workspaceId, projectId, accessToken }) => ({
        url: `/workspaces/${workspaceId}` + `/projects/${projectId}`,
        method: "GET",
        headers: createAuthorizationHeaders(accessToken),
      }),

      serializeQueryArgs: ({ queryArgs }) =>
        `project:${queryArgs.workspaceId}:${queryArgs.projectId}`,

      providesTags: (_project, _error, arguments_) => [
        {
          type: "Project",
          id: arguments_.projectId,
        },
      ],
    }),

    createProject: builder.mutation<Project, CreateProjectRequest>({
      query: ({ workspaceId, input, accessToken }) => ({
        url: `/workspaces/${workspaceId}/projects`,
        method: "POST",
        headers: createAuthorizationHeaders(accessToken),
        body: input,
      }),

      /*
       * Only the project list belonging to this
       * workspace is invalidated.
       */
      invalidatesTags: (_project, _error, arguments_) => [
        {
          type: "Project",
          id: getProjectListTagId(arguments_.workspaceId),
        },
      ],
    }),

    updateProject: builder.mutation<Project, UpdateProjectRequest>({
      query: ({ workspaceId, projectId, input, accessToken }) => ({
        url: `/workspaces/${workspaceId}` + `/projects/${projectId}`,
        method: "PATCH",
        headers: createAuthorizationHeaders(accessToken),
        body: input,
      }),

      invalidatesTags: (_project, _error, arguments_) => [
        {
          type: "Project",
          id: arguments_.projectId,
        },
        {
          type: "Project",
          id: getProjectListTagId(arguments_.workspaceId),
        },
      ],
    }),

    archiveProject: builder.mutation<void, ProjectRequest>({
      query: ({ workspaceId, projectId, accessToken }) => ({
        url: `/workspaces/${workspaceId}` + `/projects/${projectId}`,
        method: "DELETE",
        headers: createAuthorizationHeaders(accessToken),
      }),

      invalidatesTags: (_result, _error, arguments_) => [
        {
          type: "Project",
          id: arguments_.projectId,
        },
        {
          type: "Project",
          id: getProjectListTagId(arguments_.workspaceId),
        },
      ],
    }),

    restoreProject: builder.mutation<Project, ProjectRequest>({
      query: ({ workspaceId, projectId, accessToken }) => ({
        url: `/workspaces/${workspaceId}` + `/projects/${projectId}/restore`,
        method: "PATCH",
        headers: createAuthorizationHeaders(accessToken),
      }),

      invalidatesTags: (_project, _error, arguments_) => [
        {
          type: "Project",
          id: arguments_.projectId,
        },
        {
          type: "Project",
          id: getProjectListTagId(arguments_.workspaceId),
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation: useCreateProjectRtkMutation,
  useUpdateProjectMutation: useUpdateProjectRtkMutation,
  useArchiveProjectMutation: useArchiveProjectRtkMutation,
  useRestoreProjectMutation: useRestoreProjectRtkMutation,
} = projectRtkApi;
