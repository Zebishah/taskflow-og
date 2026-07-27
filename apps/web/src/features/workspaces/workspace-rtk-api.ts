import { taskflowApi } from "../../app/taskflow-api";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceDetails,
} from "./workspace.types";

interface AuthenticatedRequest {
  accessToken: string;
}

interface WorkspaceRequest extends AuthenticatedRequest {
  workspaceId: string;
}

interface CreateWorkspaceRequest extends AuthenticatedRequest {
  input: CreateWorkspaceInput;
}

interface UpdateWorkspaceRequest extends WorkspaceRequest {
  input: UpdateWorkspaceInput;
}

function createAuthorizationHeaders(
  accessToken: string,
): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

export const workspaceRtkApi = taskflowApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query<Workspace[], AuthenticatedRequest>({
      query: ({ accessToken }) => ({
        url: "/workspaces",
        method: "GET",
        headers: createAuthorizationHeaders(accessToken),
      }),

      /*
       * The access token is intentionally excluded.
       *
       * Correct cache key:
       * workspaces
       */
      serializeQueryArgs: () => "workspaces",

      providesTags: (workspaces) => [
        {
          type: "Workspace",
          id: "LIST",
        },

        ...(workspaces?.map((workspace) => ({
          type: "Workspace" as const,
          id: workspace.id,
        })) ?? []),
      ],
    }),

    getWorkspace: builder.query<WorkspaceDetails, WorkspaceRequest>({
      query: ({ workspaceId, accessToken }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "GET",
        headers: createAuthorizationHeaders(accessToken),
      }),

      /*
       * Examples:
       * workspace:workspace-a-id
       * workspace:workspace-b-id
       */
      serializeQueryArgs: ({ queryArgs }) =>
        `workspace:${queryArgs.workspaceId}`,

      providesTags: (_workspace, _error, arguments_) => [
        {
          type: "Workspace",
          id: arguments_.workspaceId,
        },
      ],
    }),

    createWorkspace: builder.mutation<Workspace, CreateWorkspaceRequest>({
      query: ({ input, accessToken }) => ({
        url: "/workspaces",
        method: "POST",
        headers: createAuthorizationHeaders(accessToken),
        body: input,
      }),

      /*
       * The mounted workspace list is automatically
       * fetched again after creation.
       */
      invalidatesTags: [
        {
          type: "Workspace",
          id: "LIST",
        },
      ],
    }),

    updateWorkspace: builder.mutation<Workspace, UpdateWorkspaceRequest>({
      query: ({ workspaceId, input, accessToken }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "PATCH",
        headers: createAuthorizationHeaders(accessToken),
        body: input,
      }),

      invalidatesTags: (_workspace, _error, arguments_) => [
        {
          type: "Workspace",
          id: arguments_.workspaceId,
        },
        {
          type: "Workspace",
          id: "LIST",
        },
      ],
    }),

    deleteWorkspace: builder.mutation<void, WorkspaceRequest>({
      query: ({ workspaceId, accessToken }) => ({
        url: `/workspaces/${workspaceId}`,
        method: "DELETE",
        headers: createAuthorizationHeaders(accessToken),
      }),

      invalidatesTags: (_result, _error, arguments_) => [
        {
          type: "Workspace",
          id: arguments_.workspaceId,
        },
        {
          type: "Workspace",
          id: "LIST",
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceQuery,
  useCreateWorkspaceMutation: useCreateWorkspaceRtkMutation,
  useUpdateWorkspaceMutation: useUpdateWorkspaceRtkMutation,
  useDeleteWorkspaceMutation: useDeleteWorkspaceRtkMutation,
} = workspaceRtkApi;
