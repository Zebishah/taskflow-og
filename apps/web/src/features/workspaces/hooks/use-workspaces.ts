import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/use-auth";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaces,
  updateWorkspace,
} from "../workspace-api";
import { workspaceQueryKeys } from "../workspace-query-keys";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceDetails,
} from "../workspace.types";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required to access workspaces");
  }

  return accessToken;
}

export function useWorkspacesQuery() {
  const { accessToken } = useAuth();

  return useQuery<Workspace[]>({
    queryKey: workspaceQueryKeys.list(),

    queryFn: () => getWorkspaces(requireAccessToken(accessToken)),

    enabled: accessToken !== null,

    staleTime: 30_000,
  });
}

export function useWorkspaceQuery(workspaceId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery<WorkspaceDetails>({
    queryKey: workspaceQueryKeys.detail(workspaceId ?? ""),

    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace identifier is required");
      }

      return getWorkspace(workspaceId, requireAccessToken(accessToken));
    },

    enabled:
      accessToken !== null &&
      workspaceId !== undefined &&
      workspaceId.length > 0,

    staleTime: 30_000,
  });
}

export function useCreateWorkspaceMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      createWorkspace(input, requireAccessToken(accessToken)),

    onSuccess: (workspace) => {
      queryClient.setQueryData<Workspace[]>(
        workspaceQueryKeys.list(),
        (currentWorkspaces) => {
          if (!currentWorkspaces) {
            return [workspace];
          }

          const alreadyExists = currentWorkspaces.some(
            (item) => item.id === workspace.id,
          );

          if (alreadyExists) {
            return currentWorkspaces;
          }

          return [...currentWorkspaces, workspace].sort((first, second) =>
            first.name.localeCompare(second.name),
          );
        },
      );

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });
    },
  });
}

interface UpdateWorkspaceVariables {
  workspaceId: string;
  input: UpdateWorkspaceInput;
}

export function useUpdateWorkspaceMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, input }: UpdateWorkspaceVariables) =>
      updateWorkspace(workspaceId, input, requireAccessToken(accessToken)),

    onSuccess: (workspace) => {
      queryClient.setQueryData<WorkspaceDetails>(
        workspaceQueryKeys.detail(workspace.id),
        (currentWorkspace) => ({
          ...workspace,
          memberCount: currentWorkspace?.memberCount ?? 1,
        }),
      );

      queryClient.setQueryData<Workspace[]>(
        workspaceQueryKeys.list(),
        (currentWorkspaces) =>
          currentWorkspaces?.map((item) =>
            item.id === workspace.id ? workspace : item,
          ),
      );

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.detail(workspace.id),
      });

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      deleteWorkspace(workspaceId, requireAccessToken(accessToken)),

    onSuccess: (_result, deletedWorkspaceId) => {
      queryClient.removeQueries({
        queryKey: workspaceQueryKeys.detail(deletedWorkspaceId),
      });

      queryClient.setQueryData<Workspace[]>(
        workspaceQueryKeys.list(),
        (currentWorkspaces) =>
          currentWorkspaces?.filter(
            (workspace) => workspace.id !== deletedWorkspaceId,
          ),
      );

      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.list(),
      });
    },
  });
}
