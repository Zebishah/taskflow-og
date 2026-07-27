import { skipToken } from "@reduxjs/toolkit/query/react";

import { useAuth } from "../../auth/use-auth";
import {
  useCreateWorkspaceRtkMutation,
  useDeleteWorkspaceRtkMutation,
  useGetWorkspaceQuery,
  useGetWorkspacesQuery,
  useUpdateWorkspaceRtkMutation,
} from "../../workspaces/workspace-rtk-api";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "../../workspaces/workspace.types";

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required to access workspaces");
  }

  return accessToken;
}

export function useWorkspacesQuery() {
  const { accessToken } = useAuth();

  return useGetWorkspacesQuery(
    accessToken
      ? {
          accessToken,
        }
      : skipToken,
    {
      /*
       * Use cached data immediately.
       * Refetch in the background if older than 60 seconds.
       */
      refetchOnMountOrArgChange: 60,
    },
  );
}

export function useWorkspaceQuery(workspaceId: string | undefined) {
  const { accessToken } = useAuth();

  return useGetWorkspaceQuery(
    workspaceId && accessToken
      ? {
          workspaceId,
          accessToken,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: 60,
    },
  );
}

export function useCreateWorkspaceMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useCreateWorkspaceRtkMutation();

  return {
    ...mutation,

    /*
     * Existing components use isPending because that
     * was the TanStack Query property name.
     */
    isPending: mutation.isLoading,

    mutateAsync: (input: CreateWorkspaceInput) =>
      trigger({
        input,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}

interface UpdateWorkspaceVariables {
  workspaceId: string;
  input: UpdateWorkspaceInput;
}

export function useUpdateWorkspaceMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useUpdateWorkspaceRtkMutation();

  return {
    ...mutation,
    isPending: mutation.isLoading,

    mutateAsync: ({ workspaceId, input }: UpdateWorkspaceVariables) =>
      trigger({
        workspaceId,
        input,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}

export function useDeleteWorkspaceMutation() {
  const { accessToken } = useAuth();

  const [trigger, mutation] = useDeleteWorkspaceRtkMutation();

  return {
    ...mutation,
    isPending: mutation.isLoading,

    mutateAsync: (workspaceId: string) =>
      trigger({
        workspaceId,
        accessToken: requireAccessToken(accessToken),
      }).unwrap(),
  };
}
